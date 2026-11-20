# 모아핏 연구 기록 수집 서버

이 디렉터리는 Supabase 배포용 소스입니다. 소스 작성과 로컬 검증만으로 서버가 생성되지는 않습니다. 실제 배포 후 발급된 수집 URL을 `panel-config.js`에 연결해야 외부 참가자의 기록이 서버에 저장됩니다.

## 배포 파일

Supabase 연결 도구의 migration 적용 기능에 `20261121_create_collector.sql` 전체를 전달합니다. 이름은 `create_moafit_collector`로 지정할 수 있습니다. 기존 테이블을 삭제하거나 변경하지 않는 신규 migration이며, 동일 migration을 중복 적용하지 않습니다.

Edge Function 배포 도구에는 다음 값을 사용합니다.

| 항목      | 값                                          |
| --------- | ------------------------------------------- |
| 함수 이름 | `moafit-collect`                            |
| 진입 파일 | `index.ts`                                  |
| JWT 검증  | `false`                                     |
| 포함 파일 | `index.ts`, `handler.mjs`, `validation.mjs` |

세 소스 파일은 같은 디렉터리에 배치합니다. 배포 도구에 파일 본문을 전달하는 경우 파일 이름과 상대 import 경로를 그대로 유지합니다. `config.toml`은 Supabase CLI용 동일 설정입니다. CLI로 배포하려면 세 파일을 `supabase/functions/moafit-collect/`로 복사하고 함수별 설정을 프로젝트의 `supabase/config.toml`에 반영합니다.

익명 참가자가 로그인 없이 POST하는 전용 수집 함수이므로 **이 함수에 한해서** JWT 검증을 끕니다. 테이블과 RPC는 익명 사용자가 접근할 수 없습니다. [Supabase 함수 설정](https://supabase.com/docs/guides/functions/function-configuration), [데이터베이스 함수 권한](https://supabase.com/docs/guides/database/functions)을 따릅니다.

## 서버 환경변수

| 이름                        | 기본값 / 의미                                                                    |
| --------------------------- | -------------------------------------------------------------------------------- |
| `SUPABASE_URL`              | Supabase 서버 환경이 제공하는 프로젝트 URL                                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서버 환경에서만 읽는 관리자 키. 브라우저에 전달하지 않음                |
| `MOA_STUDY_ID`              | `finance-decision-20261120`                                                      |
| `MOA_FORCE_TEST`            | 기본 `true`. 정확히 `false`일 때만 운영 데이터로 분류                            |
| `MOA_ALLOWED_ORIGINS`       | `https://saeromlee.kr,https://www.saeromlee.kr`                                  |
| `MOA_ALLOW_LOCALHOST_QA`    | 기본 `false`. `true`면 HTTP localhost, 127.0.0.1, IPv6 loopback의 로컬 검증 허용 |

`MOA_ALLOWED_ORIGINS`는 경로·끝 슬래시가 없는 HTTPS origin을 쉼표로 구분합니다. OPTIONS 요청에 해당 origin의 CORS 헤더를 반환하며 와일드카드나 쿠키 인증을 쓰지 않습니다. [CORS 처리](https://supabase.com/docs/guides/functions/cors)와 [서버 비밀값](https://supabase.com/docs/guides/functions/secrets)을 참고합니다.

클라이언트의 `isTest` 값과 관계없이 서버가 시험/운영 구분을 결정합니다. 현재 임시 복귀 페이지를 사용하는 동안은 `MOA_FORCE_TEST=true`, 클라이언트 `testMode:true`로 유지합니다. 운영 전환 시 실제 엠브레인 복귀 URL·상태 코드, `MOA_FORCE_TEST=false`, 클라이언트 `testMode:false`를 함께 적용하고 새 세션으로 확인합니다. 기존 시험 세션의 분류를 운영으로 바꾸지 않습니다.

운영 전환 시에는 `MOA_STUDY_ID`와 클라이언트 `studyId`도 동일한 **새 운영 조사 번호**로 함께 바꿉니다. 대기열은 조사 번호별로 분리되므로, 서버 연결 전에 기기에 쌓인 시험 기록이 운영 데이터로 재분류되어 전송되지 않도록 하기 위한 설정입니다. 시험 조사 번호와 운영 조사 번호를 재사용하지 않습니다.

## 클라이언트 연결

배포 후 수집 URL은 `https://PROJECT_REF.supabase.co/functions/v1/moafit-collect`입니다. `panel-config.js`의 `collectionUrl`에 이 URL을 넣고 `collectionRequired:true`를 적용합니다. URL은 공개 주소이며 브라우저에 관리자 키, 데이터베이스 비밀번호, service role 토큰을 넣지 않습니다.

GET은 데이터 없이 `{ "ok": true, "service": "moafit-collector", "version": 1 }`만 반환합니다. 실제 저장 확인은 허용 origin에서 시험 레코드를 POST한 다음 아래 비공개 SQL로 해당 세션을 조회해야 합니다. GET 성공만으로 수집 검증이 끝나지 않습니다.

## 전송 계약

POST는 `application/json` 또는 `text/plain` JSON이며 최대 512 KiB입니다. 다음 필드는 필수입니다.

- 고정 `studyId`, UUID `sessionId`, 세션별 임의 `writeToken` 32–128자, 양의 정수 `revision`.
- 원문 `panel_id` 문자열 또는 시험 모드에서만 `null`. 빈 값·제어 문자·512자 초과·`[ID]` 같은 자리표시는 거부하며 ID를 잘라내거나 바꾸지 않습니다.
- `condition`, `startedAt`, `panelOutcome`, `choices`, 누적 `events`, `totalMs`, 현재 `step`. 타임스탬프는 실제 UTC ISO 형식 `YYYY-MM-DDTHH:mm:ss.sssZ`입니다.
- `events[].sequence`는 1부터 연속이며 최대 1,500개입니다. 매번 세션 전체 이벤트 목록을 보냅니다. 이벤트 시간, 단계 번호, 행동 이름, JSON 값의 크기와 구조를 검증합니다.
- `in_progress`는 최종 결정·완료 시간·복귀 상태 코드가 `null`입니다. `complete`는 모든 선택, 1~8단계 방문, 일치하는 `final_decision` 로그, `apply` 또는 `decline` 결정이 필요합니다. 전체 신청 거절도 정상 완료입니다. `out`은 중단 시점까지의 부분 선택을 허용합니다.

정상 응답은 다음 형식입니다.

```json
{
  "ok": true,
  "receiptId": "세션별 고정 UUID",
  "sessionId": "요청과 동일한 UUID 문자열",
  "ackRevision": 12,
  "lastEventSequence": 12,
  "panelOutcome": "complete",
  "ignored": false
}
```

세션 최초 쓰기에서 고정한 토큰의 SHA-256 해시를 검사합니다. 같은 세션에 다른 토큰을 쓰면 403입니다. 원문 토큰은 연구 테이블에 저장하지 않습니다. 패널 ID, 조건, 시험 구분, 시작 시간도 첫 쓰기 이후 변경하지 않습니다.

모든 쓰기는 행 잠금과 한 트랜잭션으로 처리합니다. 낮은 revision은 무시하고, 같은 revision은 동일 본문의 재시도일 때만 같은 영수증으로 응답합니다. 같은 revision의 다른 본문, 과거 이벤트 변경, 이벤트 목록 축소, 완료/중단 상태 충돌은 409입니다. `complete` 또는 `out` 이후 늦게 도착한 진행 기록은 최종 상태를 되돌리지 않습니다. 동일 최종 상태의 더 높은 revision은 감사 이벤트를 추가할 수 있지만 최종 선택과 완료 시간·체류 시간의 snapshot은 봉인합니다.

클라이언트는 `ok`뿐 아니라 세션 ID, 충분한 `ackRevision`, 충분한 `lastEventSequence`, 요청한 최종 상태까지 확인해야 저장이 끝난 것으로 처리합니다. 과거 진행 요청에는 저장된 최종 상태의 ACK가 돌아올 수 있습니다.

공개 origin 제한은 브라우저 접근 제어입니다. 요청 발신자의 패널 소속을 증명하는 인증은 아니며 익명 세션 생성은 공개되어 있습니다. 세션별 쓰기 토큰은 이미 생성된 세션의 갱신 권한만 보호합니다.

## 연구 데이터 확인

두 테이블은 `moafit_private` 스키마에 있으며 RLS를 활성화하고 브라우저 역할의 테이블·스키마 접근 및 RPC 실행 권한을 제거했습니다. `service_role`에는 보호된 RPC 실행 권한만 주며 테이블 직접 권한도 제거합니다. 연구자는 Supabase SQL Editor 등 관리자 경로로 조회합니다.

```sql
select study_id, session_id, panel_id, is_test, condition,
       panel_outcome, panel_status, final_decision,
       revision, last_event_sequence, started_at, completed_at,
       total_ms, receipt_id, snapshot->'choices' as choices
from moafit_private.sessions
where study_id = 'finance-decision-20261120'
order by created_at desc;

select session_id, sequence, step_index, step, action, value,
       client_at, elapsed_ms, received_at
from moafit_private.events
where study_id = 'finance-decision-20261120'
order by session_id, sequence;
```

연구 테이블에는 요청 헤더의 IP나 User-Agent를 복사하지 않습니다. 알 수 없는 최상위 메타데이터는 버리며 이벤트 값에 포함된 IP·UA·이메일·전화·쿠키·인증 토큰 키도 제거합니다. 패널 ID는 연동에 필요한 원문으로 보존하므로 데이터 조회·내보내기는 관리자 경로에서 수행합니다.

## 로컬 검증

Node 기본 테스트로 검증·HTTP 라우팅을 확인합니다. DB 테스트는 PGlite의 실제 PostgreSQL 엔진에서 migration과 RPC를 실행합니다.

```sh
npm install --prefix experiments/dark-pattern-finance/server/.qa --no-package-lock --no-save @electric-sql/pglite
node --test experiments/dark-pattern-finance/server/*.test.mjs
```

PGlite가 설치되지 않으면 DB 테스트만 명시적으로 건너뜁니다. `.qa/node_modules`는 검증용이며 배포나 소스 패키지에 포함하지 않습니다. 외부 서비스로 시험 요청을 보내는 테스트는 없습니다. 로컬 테스트 통과와 실제 Supabase 배포·권한·브라우저 저장 검증은 구분해야 합니다.
