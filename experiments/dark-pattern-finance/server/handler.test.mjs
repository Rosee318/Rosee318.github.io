import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createHandler, originAllowed } from "./handler.mjs";
import { fixture, TEST_SESSION } from "./test-fixtures.mjs";

const env = { SUPABASE_URL: "https://project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "TEST_SERVER_KEY_NEVER_CLIENT" };
const ack = () => ({
  ok: true,
  receiptId: "receipt-test",
  sessionId: TEST_SESSION,
  ackRevision: 1,
  lastEventSequence: 1,
  panelOutcome: "in_progress",
});
const reply = (body = ack(), status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
function request(body = fixture(), extra = {}) {
  return new Request("https://project.supabase.co/functions/v1/moafit-collect", {
    method: "POST",
    headers: { Origin: "https://saeromlee.kr", "Content-Type": "application/json", ...extra.headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
    ...extra,
  });
}
const handler = (fetcher = async () => reply(), overrides = {}) =>
  createHandler({ env: { ...env, ...overrides }, fetcher, cryptoProvider: webcrypto });

test("public health endpoint discloses no records", async () => {
  const response = await handler()(new Request("https://project.supabase.co/functions/v1/moafit-collect"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "moafit-collector", version: 1 });
});

test("origin allowlist is exact; localhost is opt-in", () => {
  const allowed = new Set(["https://saeromlee.kr"]);
  assert.equal(originAllowed("https://saeromlee.kr", allowed), true);
  assert.equal(originAllowed("https://saeromlee.kr.evil.test", allowed), false);
  assert.equal(originAllowed("null", allowed), false);
  assert.equal(originAllowed(null, allowed), false);
  assert.equal(originAllowed("http://127.0.0.1:8765", allowed), false);
  assert.equal(originAllowed("http://127.0.0.1:8765", allowed, true), true);
});

test("CORS preflight allows only the configured origin", async () => {
  const response = await handler()(
    new Request("https://project.supabase.co/functions/v1/moafit-collect", { method: "OPTIONS", headers: { Origin: "https://saeromlee.kr" } })
  );
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://saeromlee.kr");
  assert.equal(response.headers.get("Access-Control-Allow-Credentials"), null);
  assert.equal(response.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
  const denied = await handler()(
    new Request("https://project.supabase.co/functions/v1/moafit-collect", { method: "OPTIONS", headers: { Origin: "https://other.test" } })
  );
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("Access-Control-Allow-Origin"), null);
});

test("missing or disallowed POST origin never reaches storage", async () => {
  let calls = 0;
  const handle = handler(async () => {
    calls++;
    return reply();
  });
  assert.equal((await handle(request(fixture(), { headers: { "Content-Type": "application/json" } }))).status, 403);
  assert.equal((await handle(request(fixture(), { headers: { Origin: "https://other.test", "Content-Type": "application/json" } }))).status, 403);
  assert.equal(calls, 0);
});

test("only JSON or text/plain JSON is accepted", async () => {
  const response = await handler()(
    request("a=b", { headers: { Origin: "https://saeromlee.kr", "Content-Type": "application/x-www-form-urlencoded" } })
  );
  assert.equal(response.status, 415);
  assert.equal((await handler()(request("{"))).status, 400);
  assert.equal((await handler()(request(fixture(), { headers: { Origin: "https://saeromlee.kr", "Content-Type": "text/plain" } }))).status, 200);
});

test("stream body is bounded even without trusting Content-Length", async () => {
  const response = await handler()(request(" ".repeat(512 * 1024 + 1)));
  assert.equal(response.status, 413);
});

test("only a SHA-256 hash goes to the database; headers and unknown metadata are stripped", async () => {
  let rpc;
  const response = await handler(async (url, options) => {
    rpc = { url, ...options };
    return reply();
  })(request(fixture({ ip: "198.51.100.1", userAgent: "TEST" })));
  assert.equal(response.status, 200);
  assert.equal(rpc.url, "https://project.supabase.co/rest/v1/rpc/moafit_ingest_session");
  const sent = JSON.parse(rpc.body);
  assert.match(sent.p_token_hash, /^[a-f0-9]{64}$/);
  assert.equal(sent.p_record.writeToken, undefined);
  assert.equal(sent.p_record.ip, undefined);
  assert.equal(sent.p_record.userAgent, undefined);
  assert.equal(sent.p_record.panel_id, "QA+&한글");
  assert.equal(rpc.headers.apikey, env.SUPABASE_SERVICE_ROLE_KEY);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("server errors are classified without echoing database details", async () => {
  for (const [code, expected] of [
    ["42501", 403],
    ["23514", 409],
    ["22023", 400],
    ["unexpected", 503],
  ]) {
    const response = await handler(async () => reply({ code, message: "PRIVATE DATABASE DETAIL" }, 400))(request());
    assert.equal(response.status, expected);
    assert.equal((await response.text()).includes("PRIVATE DATABASE DETAIL"), false);
  }
});

test("invalid receipt or another session's acknowledgement is not reported as saved", async () => {
  assert.equal((await handler(async () => reply({ ...ack(), sessionId: "wrong" }))(request())).status, 503);
  assert.equal((await handler(async () => reply({ ...ack(), receiptId: null }))(request())).status, 503);
  assert.equal((await handler(async () => reply({ ...ack(), receiptId: "" }))(request())).status, 503);
});

test("collector never falls back to anonymous database access when server credentials are absent", async () => {
  let calls = 0;
  const response = await handler(
    async () => {
      calls++;
      return reply();
    },
    { SUPABASE_SERVICE_ROLE_KEY: "" }
  )(request());
  assert.equal(response.status, 503);
  assert.equal(calls, 0);
});

test("live mode rejects missing panel ID even when the client marks itself as a test", async () => {
  const response = await handler(undefined, { MOA_FORCE_TEST: "false" })(request(fixture({ panel_id: null, isTest: true })));
  assert.equal(response.status, 400);
});
