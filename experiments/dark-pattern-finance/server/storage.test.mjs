import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { validatePayload } from "./validation.mjs";
import { fixture, event, TEST_TOKEN, TEST_STUDY, COMPLETE_CHOICES } from "./test-fixtures.mjs";

const dependency = new URL("./.qa/node_modules/@electric-sql/pglite/dist/index.js", import.meta.url);
let available = true;
try {
  await access(dependency);
} catch (_) {
  available = false;
}

test(
  "PostgreSQL migration and ingestion invariants",
  { skip: available ? false : "Install @electric-sql/pglite in server/.qa for PostgreSQL integration tests" },
  async (t) => {
    const { PGlite } = await import(dependency.href);
    const db = new PGlite();
    try {
      await db.exec("create role anon; create role authenticated; create role service_role;");
      await db.exec(await readFile(new URL("./20261121_create_collector.sql", import.meta.url), "utf8"));
      const hash = createHash("sha256").update(TEST_TOKEN).digest("hex");
      const submit = async (raw, tokenHash = hash) => {
        const record = validatePayload(raw, { studyId: TEST_STUDY, forceTest: true });
        delete record.writeToken;
        return (await db.query("select public.moafit_ingest_session($1::jsonb, $2::text) as ack", [JSON.stringify(record), tokenHash])).rows[0].ack;
      };
      let first;
      await t.test("creates one private session and deduplicates a replay", async () => {
        first = await submit(fixture());
        const replay = await submit(fixture());
        assert.equal(replay.receiptId, first.receiptId);
        assert.equal(replay.ackRevision, 1);
        assert.equal((await db.query("select count(*)::int as n from moafit_private.sessions")).rows[0].n, 1);
        assert.equal((await db.query("select count(*)::int as n from moafit_private.events")).rows[0].n, 1);
      });
      await t.test("updates a cumulative revision without duplicating earlier events", async () => {
        const ack = await submit(fixture({ revision: 2, events: [event(1), event(2, { action: "compare_switch" })] }));
        assert.equal(ack.ackRevision, 2);
        assert.equal(ack.lastEventSequence, 2);
        assert.equal((await db.query("select count(*)::int as n from moafit_private.events")).rows[0].n, 2);
      });
      await t.test("old progress cannot overwrite a newer snapshot", async () => {
        const old = await submit(fixture());
        assert.equal(old.ackRevision, 2);
        assert.equal(old.ignored, true);
      });
      await t.test("the same revision cannot acknowledge different content as a retry", async () => {
        await assert.rejects(
          submit(fixture({ revision: 2, events: [event(1), event(2, { action: "compare_switch" })], totalMs: 9999 })),
          /revision_payload_conflict/
        );
      });
      await t.test("a different write token cannot change the same session", async () => {
        await assert.rejects(submit(fixture({ revision: 3 }), "b".repeat(64)), /session_write_denied/);
      });
      await t.test("changed historical event content rolls back the whole write", async () => {
        await assert.rejects(submit(fixture({ revision: 3, events: [event(1, { action: "altered" }), event(2)] })), /event_history_changed/);
        assert.equal((await db.query("select revision::int as n from moafit_private.sessions")).rows[0].n, 2);
      });
      const terminal = fixture({
        revision: 3,
        panelOutcome: "complete",
        finalDecision: "decline",
        panelStatus: "TEST_COMPLETE",
        completedAt: "2026-11-21T00:00:04.000Z",
        choices: { ...COMPLETE_CHOICES },
        step: 9,
        visited: [1, 2, 3, 4, 5, 6, 7, 8],
        events: [event(1), event(2, { action: "compare_switch" }), event(3, { action: "final_decision", value: { decision: "decline" } })],
      });
      await t.test("declining a financial product completes the study and creates a stable receipt", async () => {
        const ack = await submit(terminal);
        assert.equal(ack.panelOutcome, "complete");
        assert.equal(ack.receiptId, first.receiptId);
        const row = (await db.query("select final_decision, panel_status from moafit_private.sessions")).rows[0];
        assert.equal(row.final_decision, "decline");
        assert.equal(row.panel_status, "TEST_COMPLETE");
      });
      await t.test("late progress never reverses a terminal state", async () => {
        const ack = await submit(fixture({ revision: 4, events: [event(1), event(2, { action: "compare_switch" })] }));
        assert.equal(ack.panelOutcome, "complete");
        assert.equal(ack.ackRevision, 3);
        assert.equal(ack.ignored, true);
      });
      await t.test("a second terminal state is rejected rather than changing complete to out", async () => {
        await assert.rejects(
          submit({ ...terminal, revision: 4, panelOutcome: "out", finalDecision: null, panelStatus: "TEST_OUT" }),
          /terminal_outcome_conflict/
        );
      });
      await t.test("same terminal retry may append audit events but cannot rewrite final choices", async () => {
        const update = {
          ...terminal,
          revision: 4,
          choices: { ...COMPLETE_CHOICES, account: "flex" },
          events: [...terminal.events, event(4, { action: "panel_return_ready" })],
        };
        const ack = await submit(update);
        assert.equal(ack.lastEventSequence, 4);
        assert.equal((await db.query("select snapshot->'choices'->>'account' as account from moafit_private.sessions")).rows[0].account, "basic");
        const retry = await submit(update);
        assert.equal(retry.receiptId, ack.receiptId);
        assert.equal(retry.ackRevision, 4);
        assert.equal(retry.ignored, true);
      });
      await t.test("anonymous and signed-in browser roles cannot read tables or execute the RPC", async () => {
        for (const role of ["anon", "authenticated"]) {
          assert.equal((await db.query("select has_schema_privilege($1, 'moafit_private', 'USAGE') as allowed", [role])).rows[0].allowed, false);
          assert.equal(
            (await db.query("select has_function_privilege($1, 'public.moafit_ingest_session(jsonb,text)', 'EXECUTE') as allowed", [role])).rows[0]
              .allowed,
            false
          );
        }
        assert.equal(
          (await db.query("select has_function_privilege('service_role', 'public.moafit_ingest_session(jsonb,text)', 'EXECUTE') as allowed")).rows[0]
            .allowed,
          true
        );
      });
      await t.test("acknowledgement echoes the exact valid UUID spelling sent by the client", async () => {
        const sessionId = "A4DF1956-9CFA-4C3A-881B-5608353CBECA";
        assert.equal((await submit(fixture({ sessionId }))).sessionId, sessionId);
      });
    } finally {
      await db.close();
    }
  }
);
