const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const sandbox = { window: {}, URL, Set, Map, AbortController, setTimeout, clearTimeout };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../experiments/dark-pattern-finance/panel-bridge.js"), "utf8"), sandbox);
const api = sandbox.window.MoaPanelBridge;
const config = {
  enabled: true,
  studyId: "test-study",
  completeReturnUrl: "https://panel.example.test/return?survey=test&panel_id=old&status=old",
  outReturnUrl: "https://panel.example.test/out?survey=test",
  completeStatus: "C_TEST",
  outStatus: "O_TEST",
  redirectDelayMs: 0,
};
const makeRecord = (panelId = "P001") => ({ sessionId: "session-test", panel_id: panelId, studyId: config.studyId, finalDecision: "decline" });
const create = (extra = {}, fetcher) => api.create({ config: { ...config, ...extra }, href: "https://app.example.test/?panel_id=P001", fetcher });

test("panel_id preserves punctuation, spaces, plus signs and Korean through the full URL round trip", () => {
  for (const id of ["P001", "001", " a+b&c/=한글%?# "]) {
    const entry = api.parseEntry(`https://app.example.test/?panel_id=${encodeURIComponent(id)}`);
    assert.equal(entry.panelId, id);
    assert.equal(entry.error, "");
    const target = new URL(api.route(config, "complete", entry.panelId).url);
    assert.equal(target.searchParams.get("panel_id"), id);
    assert.equal(target.searchParams.get("status"), "C_TEST");
    assert.equal(target.searchParams.get("survey"), "test");
    assert.equal(target.searchParams.getAll("panel_id").length, 1);
  }
});

test("duplicate, absent, empty and overlong panel IDs fail without altering an ID", () => {
  for (const search of ["?panel=1", "?panel_id=", "?panel_id=%20", "?panel_id=%5BID%5D", "?panel_id=A&panel_id=B", `?panel_id=${"A".repeat(513)}`]) {
    assert.ok(api.parseEntry(`https://app.example.test/${search}`).error);
  }
  assert.equal(api.parseEntry("https://app.example.test/").mode, false);
});

test("only trusted configured return URLs and confirmed nonempty codes are used", () => {
  const bridge = api.create({ config, href: "https://app.example.test/?panel_id=P001&return_url=https%3A%2F%2Funtrusted.example.test" });
  assert.equal(new URL(bridge.getRoute().url).hostname, "panel.example.test");
  assert.throws(() => api.route({ ...config, enabled: false }, "complete", "P001"));
  assert.throws(() => api.route({ ...config, completeStatus: "" }, "complete", "P001"));
  assert.throws(() => api.route({ ...config, completeReturnUrl: "http://survey.panel.co.kr/2019/XXXX/m5.asp" }, "complete", "P001"));
  assert.throws(() => api.route({ ...config, completeReturnUrl: "https://panel.example.test/?token=[ID]" }, "complete", "P001"));
  assert.throws(() => api.route({ ...config, completeReturnUrl: "javascript:alert(1)" }, "complete", "P001"));
  assert.throws(() => api.route(config, "apply", "P001"));
  assert.equal(new URL(api.route({ ...config, completeStatus: "001" }, "complete", "P001").url).searchParams.get("status"), "001");
});

test("declining financial products still returns the panel completion code", async () => {
  const result = await create().submit(makeRecord(), "complete");
  assert.equal(result.outcome, "complete");
  assert.equal(result.status, "C_TEST");
  assert.equal(result.collection, "browser");
  assert.equal(new URL(result.url).pathname, "/return");
  const out = await create().submit(makeRecord(), "out");
  assert.equal(out.status, "O_TEST");
  assert.equal(new URL(out.url).pathname, "/out");
});

test("records from a different panel or study are rejected", async () => {
  await assert.rejects(create().submit(makeRecord("OTHER"), "complete"));
  await assert.rejects(create().submit({ ...makeRecord(), studyId: "other-study" }, "complete"));
  await assert.rejects(create({ collectionRequired: true }).submit(makeRecord(), "complete"));
});

test("collector requires an explicit receipt, allows retries and supplies stable idempotency keys", async () => {
  let calls = 0;
  const keys = [];
  const fetcher = async (_url, options) => {
    keys.push(JSON.parse(options.body).idempotencyKey);
    calls += 1;
    if (calls === 1) return { ok: false };
    return { ok: true, json: async () => ({ ok: true, receiptId: "receipt-test" }) };
  };
  const bridge = create({ collectionUrl: "https://collector.example.test/records" }, fetcher);
  await assert.rejects(bridge.submit(makeRecord(), "complete"));
  const receipt = await bridge.submit(makeRecord(), "complete");
  assert.equal(receipt.receiptId, "receipt-test");
  assert.equal(keys[0], keys[1]);
  await bridge.submit(makeRecord(), "complete");
  assert.equal(calls, 2);
  await assert.rejects(create({ collectionUrl: "http://collector.example.test/records" }, fetcher).submit(makeRecord(), "complete"));
  await assert.rejects(
    create({ collectionUrl: "https://collector.example.test/records" }, async () => ({ ok: true, json: async () => ({ ok: true }) })).submit(
      makeRecord(),
      "complete"
    )
  );
});

test("two simultaneous completion attempts share a single collector request", async () => {
  let calls = 0;
  let release;
  const bridge = create({ collectionUrl: "https://collector.example.test/records" }, () => {
    calls += 1;
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  const first = bridge.submit(makeRecord(), "complete");
  const second = bridge.submit(makeRecord(), "complete");
  assert.equal(calls, 1);
  release({ ok: true, json: async () => ({ ok: true, receiptId: "single-receipt" }) });
  assert.equal((await first).receiptId, "single-receipt");
  assert.equal((await second).receiptId, "single-receipt");
});

test("automatic session storage must acknowledge the final revision before survey return is ready", async () => {
  const record = { ...makeRecord(), revision: 12 };
  let submitted;
  let release;
  const bridge = api.create({
    config: { ...config, collectionUrl: "https://collector.example.test/records", collectionRequired: true },
    href: "https://app.example.test/?panel_id=P001",
    saveRecord: (value) => {
      submitted = value;
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  });
  let ready = false;
  const pending = bridge.submit(record, "complete").then((value) => {
    ready = true;
    return value;
  });
  await Promise.resolve();
  assert.equal(ready, false);
  assert.equal(submitted.panelOutcome, "complete");
  assert.equal(submitted.panelStatus, "C_TEST");
  assert.equal(submitted.finalDecision, "decline");
  release({ ok: true, receiptId: "server-receipt", sessionId: record.sessionId, ackRevision: 12, panelOutcome: "complete" });
  const result = await pending;
  assert.equal(result.collection, "server");
  assert.equal(result.ackRevision, 12);
  assert.equal(result.receiptId, "server-receipt");
});

test("another session, stale revision or different outcome cannot authorize survey return", async () => {
  const record = { ...makeRecord(), revision: 12 };
  for (const invalid of [
    { sessionId: "other-session" },
    { ackRevision: 11 },
    { ackRevision: undefined },
    { ackRevision: "12" },
    { panelOutcome: "out" },
    { receiptId: "" },
    { ok: false },
  ]) {
    const bridge = api.create({
      config: { ...config, collectionUrl: "https://collector.example.test/records", collectionRequired: true },
      href: "https://app.example.test/?panel_id=P001",
      saveRecord: async () => ({
        ok: true,
        receiptId: "server-receipt",
        sessionId: record.sessionId,
        ackRevision: 12,
        panelOutcome: "complete",
        ...invalid,
      }),
    });
    await assert.rejects(bridge.submit(record, "complete"));
  }
});
