begin;

create schema if not exists moafit_private;
revoke all on schema moafit_private from public, anon, authenticated;

create table moafit_private.sessions (
  study_id text not null check (length(study_id) between 1 and 128),
  session_id uuid not null,
  panel_id text check (panel_id is null or length(panel_id) between 1 and 512),
  write_token_hash text not null check (write_token_hash ~ '^[a-f0-9]{64}$'),
  is_test boolean not null,
  condition text not null check (condition in ('dark', 'neutral')),
  app_version text not null,
  revision bigint not null default 0 check (revision between 0 and 1000000000),
  panel_outcome text not null default 'in_progress' check (panel_outcome in ('in_progress', 'complete', 'out')),
  panel_status text,
  final_decision text check (final_decision in ('apply', 'decline')),
  started_at timestamptz not null,
  completed_at timestamptz,
  total_ms bigint not null default 0 check (total_ms between 0 and 604800000),
  last_event_sequence integer not null default 0 check (last_event_sequence between 0 and 1500),
  last_record_hash text check (last_record_hash ~ '^[a-f0-9]{64}$'),
  receipt_id uuid not null default gen_random_uuid(),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (study_id, session_id),
  check (is_test or panel_id is not null),
  check ((panel_outcome = 'in_progress' and completed_at is null and final_decision is null)
    or (panel_outcome = 'complete' and completed_at is not null and final_decision in ('apply', 'decline'))
    or (panel_outcome = 'out' and completed_at is not null and final_decision is null))
);

create table moafit_private.events (
  study_id text not null,
  session_id uuid not null,
  sequence integer not null check (sequence between 1 and 1500),
  step_index smallint not null check (step_index between 0 and 9),
  step text not null,
  action text not null,
  value jsonb,
  client_at timestamptz not null,
  elapsed_ms bigint not null check (elapsed_ms between 0 and 604800000),
  event_payload jsonb not null,
  received_at timestamptz not null default now(),
  primary key (study_id, session_id, sequence),
  foreign key (study_id, session_id) references moafit_private.sessions(study_id, session_id) on delete cascade
);

create index sessions_panel_lookup on moafit_private.sessions(study_id, panel_id);
create index sessions_started_lookup on moafit_private.sessions(study_id, started_at);
alter table moafit_private.sessions enable row level security;
alter table moafit_private.events enable row level security;
revoke all on all tables in schema moafit_private from public, anon, authenticated, service_role;

create function public.moafit_ingest_session(p_record jsonb, p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session moafit_private.sessions%rowtype;
  v_study text := p_record->>'studyId';
  v_id uuid := (p_record->>'sessionId')::uuid;
  v_revision bigint := (p_record->>'revision')::bigint;
  v_outcome text := p_record->>'panelOutcome';
  v_events jsonb := p_record->'events';
  v_event jsonb;
  v_event_count integer;
  v_event_existing jsonb;
  v_ignore boolean := false;
  v_record_hash text := encode(sha256(convert_to(p_record::text, 'UTF8')), 'hex');
begin
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
    or v_study is null or length(v_study) not between 1 and 128
    or v_revision is null or v_revision not between 1 and 1000000000
    or v_outcome is null or v_outcome not in ('in_progress', 'complete', 'out')
    or jsonb_typeof(v_events) is distinct from 'array'
    or octet_length(p_record::text) > 524288
    or p_record ? 'writeToken' then
    raise exception using errcode = '22023', message = 'invalid_record';
  end if;
  v_event_count := jsonb_array_length(v_events);
  if v_event_count > 1500 or exists (
    select 1 from jsonb_array_elements(v_events) with ordinality as item(event, position)
    where (item.event->>'sequence')::integer is distinct from item.position::integer
  ) then
    raise exception using errcode = '22023', message = 'invalid_event_sequence';
  end if;

  insert into moafit_private.sessions (
    study_id, session_id, panel_id, write_token_hash, is_test, condition, app_version, started_at
  ) values (
    v_study, v_id, p_record->>'panel_id', p_token_hash, (p_record->>'isTest')::boolean,
    p_record->>'condition', coalesce(p_record->>'appVersion', 'unknown'), (p_record->>'startedAt')::timestamptz
  ) on conflict (study_id, session_id) do nothing;

  select * into strict v_session from moafit_private.sessions
    where study_id = v_study and session_id = v_id for update;
  if v_session.write_token_hash <> p_token_hash then
    raise exception using errcode = '42501', message = 'session_write_denied';
  end if;
  if v_session.panel_id is distinct from (p_record->>'panel_id')
    or v_session.is_test is distinct from ((p_record->>'isTest')::boolean)
    or v_session.condition is distinct from (p_record->>'condition')
    or v_session.started_at is distinct from ((p_record->>'startedAt')::timestamptz) then
    raise exception using errcode = '23514', message = 'session_identity_conflict';
  end if;

  if v_session.panel_outcome <> 'in_progress' then
    if v_outcome = 'in_progress' then
      v_ignore := true;
    elsif v_outcome <> v_session.panel_outcome then
      raise exception using errcode = '23514', message = 'terminal_outcome_conflict';
    elsif v_session.final_decision is distinct from (p_record->>'finalDecision') then
      raise exception using errcode = '23514', message = 'terminal_decision_conflict';
    end if;
  end if;
  if v_revision = v_session.revision and not v_ignore and v_session.last_record_hash is distinct from v_record_hash then
    raise exception using errcode = '23514', message = 'revision_payload_conflict';
  end if;
  if v_revision <= v_session.revision then v_ignore := true; end if;

  if not v_ignore then
    if v_event_count < v_session.last_event_sequence then
      raise exception using errcode = '23514', message = 'event_history_shortened';
    end if;
    for v_event in select value from jsonb_array_elements(v_events) loop
      select event_payload into v_event_existing from moafit_private.events
        where study_id = v_study and session_id = v_id and sequence = (v_event->>'sequence')::integer;
      if found then
        if v_event_existing is distinct from v_event then
          raise exception using errcode = '23514', message = 'event_history_changed';
        end if;
      else
        insert into moafit_private.events (
          study_id, session_id, sequence, step_index, step, action, value, client_at, elapsed_ms, event_payload
        ) values (
          v_study, v_id, (v_event->>'sequence')::integer, (v_event->>'stepIndex')::smallint,
          v_event->>'step', v_event->>'action', v_event->'value',
          (v_event->>'at')::timestamptz, (v_event->>'elapsedMs')::bigint, v_event
        );
      end if;
    end loop;

    if v_session.panel_outcome = 'in_progress' then
      update moafit_private.sessions set
        revision = v_revision,
        panel_outcome = v_outcome,
        panel_status = p_record->>'panelStatus',
        final_decision = p_record->>'finalDecision',
        completed_at = (p_record->>'completedAt')::timestamptz,
        total_ms = (p_record->>'totalMs')::bigint,
        last_event_sequence = v_event_count,
        last_record_hash = v_record_hash,
        app_version = coalesce(p_record->>'appVersion', 'unknown'),
        snapshot = p_record - 'events',
        updated_at = now()
      where study_id = v_study and session_id = v_id returning * into v_session;
    else
      -- A terminal choice is sealed. Transport retries may append audit events, never rewrite the final choice.
      update moafit_private.sessions set revision = v_revision,
        last_event_sequence = v_event_count, last_record_hash = v_record_hash, updated_at = now()
      where study_id = v_study and session_id = v_id returning * into v_session;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true, 'receiptId', v_session.receipt_id::text, 'sessionId', p_record->>'sessionId',
    'ackRevision', v_session.revision, 'lastEventSequence', v_session.last_event_sequence,
    'panelOutcome', v_session.panel_outcome, 'ignored', v_ignore
  );
end;
$$;

revoke all on function public.moafit_ingest_session(jsonb, text) from public, anon, authenticated;
grant execute on function public.moafit_ingest_session(jsonb, text) to service_role;
comment on table moafit_private.sessions is '모아핏 연구 기록. 비공개; 익명 업로드는 Edge Function을 통해서만 허용.';
comment on table moafit_private.events is '모아핏 선택 및 행동 기록. 브라우저 헤더의 IP·UA를 수집하지 않음.';

commit;
