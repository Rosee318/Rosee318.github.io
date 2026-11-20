const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { webcrypto } = require("node:crypto");
const sandbox = { window: { crypto: webcrypto }, URL, Set, Map, TextEncoder, Uint8Array, AbortController, setTimeout, clearTimeout };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../experiments/dark-pattern-finance/session-sync.js"), "utf8"), sandbox);
const api = sandbox.window.MoaSessionSync;

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
    key: (index) => [...data.keys()][index] || null,
    get length() {
      return data.size;
    },
    dump: () => [...data.values()][0],
    records: () => [...data.values()].flatMap((value) => JSON.parse(value).entries),
  };
}
function record(revision = 1, extra = {}) {
  return {
    studyId: "study-test",
    sessionId: "session-one",
    panel_id: " P+&한글 ",
    revision,
    events: [{ sequence: 1, action: "entry" }],
    choices: {},
    panelOutcome: null,
    ...extra,
  };
}
function reply(payload, overrides = {}) {
  return {
    ok: true,
    json: async () => ({
      ok: true,
      sessionId: payload.sessionId,
      receiptId: "receipt-one",
      ackRevision: payload.revision,
      lastEventSequence: payload.events.at(-1)?.sequence || 0,
      panelOutcome: payload.panelOutcome,
      ...overrides,
    }),
  };
}
function create(options = {}) {
  return api.create({
    endpoint: "https://collector.example.test/collect",
    studyId: "study-test",
    storage: memoryStorage(),
    debounceMs: 10000,
    ...options,
  });
}

test("progress is saved with the raw panel ID and a durable session write token", async () => {
  const storage = memoryStorage();
  const sent = [];
  const client = create({
    storage,
    fetcher: async (_url, options) => {
      sent.push({ options, payload: JSON.parse(options.body) });
      return reply(sent.at(-1).payload);
    },
  });
  const result = await client.flush(record());
  assert.equal(result.status, "saved");
  assert.equal(result.ackRevision, 1);
  assert.equal(sent[0].payload.panel_id, " P+&한글 ");
  assert.equal(sent[0].payload.panelOutcome, "in_progress");
  assert.equal(sent[0].payload.isTest, true);
  assert.match(sent[0].payload.writeToken, /^[a-f0-9]{64}$/);
  assert.equal(sent[0].options.credentials, "omit");
  assert.equal(sent[0].options.referrerPolicy, "no-referrer");
  assert.ok(storage.dump().includes(sent[0].payload.writeToken));
  assert.equal(JSON.parse(storage.dump()).entries[0].pending, null);
});

test("network failure leaves a durable queue and reload retry uses the same token", async () => {
  const storage = memoryStorage();
  const firstPayloads = [];
  const first = create({
    storage,
    fetcher: async (_url, options) => {
      firstPayloads.push(JSON.parse(options.body));
      throw new Error("offline");
    },
  });
  await assert.rejects(first.flush(record()));
  assert.equal(first.state("session-one").status, "error");
  assert.equal(JSON.parse(storage.dump()).entries[0].pending.revision, 1);
  const retried = [];
  const reloaded = create({
    storage,
    fetcher: async (_url, options) => {
      const payload = JSON.parse(options.body);
      retried.push(payload);
      return reply(payload);
    },
  });
  await reloaded.retryPending();
  assert.equal(retried.length, 1);
  assert.equal(retried[0].writeToken, firstPayloads[0].writeToken);
  assert.equal(reloaded.state("session-one").status, "saved");
});

test("an empty endpoint queues durably without sending or repeating requests", async () => {
  let calls = 0;
  const storage = memoryStorage();
  const client = create({
    endpoint: "",
    storage,
    fetcher: async () => {
      calls += 1;
    },
  });
  client.enqueue(record());
  assert.equal(client.state("session-one").status, "not_configured");
  await assert.rejects(client.flush(record()), /서버/);
  assert.equal(calls, 0);
  assert.equal(JSON.parse(storage.dump()).entries[0].pending.revision, 1);
});

test("mismatched or incomplete ACKs never remove the pending record", async () => {
  for (const mismatch of [
    { sessionId: "other" },
    { ackRevision: 0 },
    { lastEventSequence: 0 },
    { receiptId: "" },
    { panelOutcome: "unknown" },
    { studyId: "another" },
  ]) {
    const storage = memoryStorage();
    const client = create({ storage, fetcher: async (_url, options) => reply(JSON.parse(options.body), mismatch) });
    await assert.rejects(client.flush(record()));
    assert.equal(client.state("session-one").pendingRevision, 1);
    assert.equal(JSON.parse(storage.dump()).entries[0].pending.revision, 1);
  }
});

test("concurrent progress and completion are serialized and completion waits for its own ACK", async () => {
  const pending = [];
  const client = create({
    fetcher: (_url, options) =>
      new Promise((resolve) => {
        pending.push({ payload: JSON.parse(options.body), resolve });
      }),
  });
  const progress = client.flush(record());
  await Promise.resolve();
  assert.equal(pending.length, 1);
  const terminal = record(2, {
    panelOutcome: "complete",
    finalDecision: "decline",
    events: [
      { sequence: 1, action: "entry" },
      { sequence: 2, action: "finish" },
    ],
  });
  const completion = client.flush(terminal);
  assert.equal(pending.length, 1);
  pending[0].resolve(reply(pending[0].payload));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(pending.length, 2);
  assert.equal(pending[1].payload.panelOutcome, "complete");
  assert.equal(client.state("session-one").ackRevision, 1);
  pending[1].resolve(reply(pending[1].payload));
  const results = await Promise.all([progress, completion]);
  assert.equal(results[1].ackRevision, 2);
  assert.equal(client.state("session-one").panelOutcome, "complete");
});

test("duplicate terminal saves reuse the ACK and a terminal state cannot regress", async () => {
  let calls = 0;
  const client = create({
    fetcher: async (_url, options) => {
      calls += 1;
      return reply(JSON.parse(options.body));
    },
  });
  const terminal = record(2, { panelOutcome: "out" });
  await client.flush(terminal);
  await client.flush(terminal);
  assert.equal(calls, 1);
  assert.throws(() => client.enqueue(record(3)), /종료 상태/);
  assert.throws(() => client.enqueue(record(3, { panelOutcome: "complete" })), /종료 상태/);
});

test("other panel IDs cannot overwrite a known session", async () => {
  const client = create({ fetcher: async (_url, options) => reply(JSON.parse(options.body)) });
  await client.flush(record());
  assert.throws(() => client.enqueue(record(2, { panel_id: "OTHER" })), /다른 참여자/);
});

test("the queue limit reports an error instead of evicting an unacknowledged session", () => {
  const storage = memoryStorage();
  const client = create({ endpoint: "", storage });
  for (let i = 0; i < 30; i += 1) client.enqueue(record(1, { sessionId: `session-${i}` }));
  assert.throws(() => client.enqueue(record(1, { sessionId: "overflow" })), /30건/);
  const queued = storage.records().filter((entry) => entry.pending);
  assert.equal(queued.length, 30);
  assert.equal(queued[0].sessionId, "session-0");
  assert.throws(() => client.clear("session-0"), /지울 수 없습니다/);
});

test("storage quota failure is visible and corrupted saved data is preserved", () => {
  const storage = memoryStorage();
  storage.setItem = () => {
    throw new Error("quota");
  };
  const client = create({ endpoint: "", storage });
  assert.throws(() => client.enqueue(record()), /저장 공간/);
  assert.equal(client.state("session-one").durable, false);
  const corrupt = {
    length: 1,
    key: () => "moafit-session-sync-v1:study-test:session:bad",
    getItem: () => "not-json",
    setItem: () => assert.fail("must not overwrite corrupted data"),
    removeItem: () => assert.fail("must not delete corrupted data"),
  };
  assert.throws(() => create({ storage: corrupt }), /지우지 말고/);
});

test("keepalive is used only below the browser keepalive payload limit", async () => {
  const flags = [];
  const client = create({
    fetcher: async (_url, options) => {
      flags.push(options.keepalive);
      return reply(JSON.parse(options.body));
    },
  });
  await client.flush(record(), { keepalive: true });
  await client.flush(record(2, { note: "한".repeat(22000) }), { keepalive: true });
  assert.deepEqual(flags, [true, false]);
});

test("an ACK from a terminal server cannot incorrectly confirm a different terminal outcome", async () => {
  const client = create({ fetcher: async (_url, options) => reply(JSON.parse(options.body), { panelOutcome: "complete" }) });
  await assert.rejects(client.flush(record(2, { panelOutcome: "out" })), /종료 상태/);
  assert.equal(client.state("session-one").pendingRevision, 2);
});

test("independent tabs do not overwrite each other's unacknowledged sessions", async () => {
  const storage = memoryStorage();
  const firstTab = create({ endpoint: "", storage });
  const secondTab = create({ endpoint: "", storage });
  firstTab.enqueue(record(1, { sessionId: "tab-one" }));
  secondTab.enqueue(record(1, { sessionId: "tab-two" }));
  assert.equal(storage.records().filter((entry) => entry.pending).length, 2);
  const sent = [];
  const reloaded = create({
    storage,
    fetcher: async (_url, options) => {
      const payload = JSON.parse(options.body);
      sent.push(payload.sessionId);
      return reply(payload);
    },
  });
  await reloaded.retryPending();
  assert.deepEqual(sent.sort(), ["tab-one", "tab-two"]);
  assert.equal(storage.records().filter((entry) => entry.pending).length, 0);
});

test("an older ACK cannot remove a newer snapshot saved by another tab", async () => {
  const storage = memoryStorage();
  const pending = [];
  const firstTab = create({
    storage,
    fetcher: (_url, options) => new Promise((resolve) => pending.push({ payload: JSON.parse(options.body), resolve })),
  });
  const firstSave = firstTab.flush(record());
  await Promise.resolve();
  const secondTab = create({ endpoint: "", storage });
  secondTab.enqueue(
    record(2, {
      events: [
        { sequence: 1, action: "entry" },
        { sequence: 2, action: "choice" },
      ],
    })
  );
  pending[0].resolve(reply(pending[0].payload));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(pending.length, 2);
  assert.equal(pending[1].payload.revision, 2);
  pending[1].resolve(reply(pending[1].payload));
  await firstSave;
  assert.equal(storage.records()[0].ackRevision, 2);
  assert.equal(storage.records()[0].pending, null);
});

test("an ACK does not erase a conflicting same-session branch from another tab", async () => {
  const storage = memoryStorage();
  let pending;
  const firstTab = create({
    storage,
    fetcher: (_url, options) =>
      new Promise((resolve) => {
        pending = { payload: JSON.parse(options.body), resolve };
      }),
  });
  const firstSave = firstTab.flush(record());
  await Promise.resolve();
  const storedKey = storage.key(0);
  const branched = JSON.parse(storage.getItem(storedKey));
  branched.entries[0].pending.events[0].action = "different-choice";
  storage.setItem(storedKey, JSON.stringify(branched));
  pending.resolve(reply(pending.payload));
  const result = await firstSave;
  assert.equal(result.ackRevision, 1);
  assert.equal(storage.records()[0].pending.events[0].action, "different-choice");
  assert.match(result.warning, /다른 창/);
});

test("a saved revision only confirms the same stored fields, including after reload", async () => {
  const storage = memoryStorage();
  let calls = 0;
  const fetcher = async (_url, options) => {
    calls += 1;
    return reply(JSON.parse(options.body));
  };
  const original = record(1, { choices: { account: "basic" }, condition: "dark", totalMs: 40 });
  await create({ storage, fetcher }).flush(original);
  const client = create({ storage, fetcher });
  for (const changed of [
    { choices: { account: "flex" } },
    { events: [{ sequence: 1, action: "different-choice" }] },
    { condition: "neutral" },
    { totalMs: 41 },
    { step: 2 },
  ]) {
    await assert.rejects(client.flush({ ...original, ...changed }), /다른 창/);
    assert.equal(client.state("session-one").status, "error");
    assert.equal(storage.records()[0].pending, null);
  }
  assert.equal((await client.flush(original)).status, "saved");
  assert.equal(calls, 1);
});

test("terminal retry ignores transport metadata and object key order, but rejects a different decision", async () => {
  const storage = memoryStorage();
  let calls = 0;
  const fetcher = async (_url, options) => {
    calls += 1;
    return reply(JSON.parse(options.body));
  };
  const original = record(3, {
    panelOutcome: "complete",
    finalDecision: "decline",
    panelStatus: "001",
    choices: { account: "basic", loan: "none" },
    events: [{ sequence: 1, action: "entry", value: { choice: "basic", context: { source: "test", ip: "ignored" } } }],
    panelReturn: { recordedIn: "browser", returnUrl: "https://before.example.test" },
  });
  await create({ storage, fetcher }).flush(original);
  const client = create({ storage, fetcher });
  const retry = {
    ...original,
    choices: { loan: "none", account: "basic", ignored: "not-stored" },
    events: [{ action: "entry", sequence: 1, value: { context: { ip: "changed-but-filtered", source: "test" }, choice: "basic" } }],
    panelReturn: { recordedIn: "server", returnUrl: "https://after.example.test" },
    recordedIn: "server",
  };
  const saved = await client.flush(retry);
  assert.equal(saved.status, "saved");
  await assert.rejects(client.flush({ ...retry, finalDecision: "apply" }), /다른 창/);
  assert.equal(calls, 1);
});

test("an older terminal revision is unconfirmed even when its event history is covered", async () => {
  const storage = memoryStorage();
  let calls = 0;
  const fetcher = async (_url, options) => {
    calls += 1;
    return reply(JSON.parse(options.body));
  };
  const old = record(2, { panelOutcome: "out", panelStatus: "002", completedAt: "2026-11-21T00:00:00.000Z" });
  const client = create({ storage, fetcher });
  await client.flush(old);
  const latest = { ...old, revision: 3, events: [...old.events, { sequence: 2, action: "retry_return" }] };
  await client.flush(latest);
  const reloaded = create({ storage, fetcher });
  await assert.rejects(reloaded.flush(old), /다른 창/);
  await assert.rejects(reloaded.flush({ ...old, choices: { account: "flex" } }), /다른 창/);
  await reloaded.flush({ ...latest, recordedIn: "server" });
  assert.equal(calls, 2);
  assert.equal(storage.records()[0].ackRevision, 3);
});

test("a tab refreshes another tab's newer ACK before accepting a stale branch", async () => {
  const storage = memoryStorage();
  let calls = 0;
  const fetcher = async (_url, options) => {
    calls += 1;
    return reply(JSON.parse(options.body));
  };
  const stale = create({ storage, fetcher });
  await stale.flush(record());
  const current = create({ storage, fetcher });
  const latest = record(2, { choices: { account: "basic" } });
  await current.flush(latest);
  await assert.rejects(stale.flush(record(2, { choices: { account: "flex" } })), /다른 창/);
  await assert.rejects(stale.flush(record()), /다른 창/);
  assert.equal(calls, 2);
  assert.equal(storage.records()[0].ackRevision, 2);
  assert.equal(storage.records()[0].pending, null);
});

test("a pending duplicate cannot silently replace stored fields at the same revision", () => {
  const storage = memoryStorage();
  const client = create({ endpoint: "", storage });
  client.enqueue(record(2, { choices: { account: "basic" } }));
  assert.throws(() => client.enqueue(record(2, { choices: { account: "flex" } })), /다른 창/);
  assert.throws(() => client.enqueue(record(1)), /다른 창/);
  assert.equal(storage.records()[0].pending.choices.account, "basic");
});

test("legacy ACKs without a comparable snapshot cannot claim an unverified duplicate is saved", async () => {
  const storage = memoryStorage();
  const client = create({ storage, fetcher: async (_url, options) => reply(JSON.parse(options.body)) });
  await client.flush(record());
  const storedKey = storage.key(0);
  const saved = JSON.parse(storage.getItem(storedKey));
  delete saved.entries[0].ackFingerprint;
  storage.setItem(storedKey, JSON.stringify(saved));
  const reloaded = create({ storage, fetcher: async () => assert.fail("must not claim a legacy snapshot was sent") });
  await assert.rejects(reloaded.flush(record()), /다른 창/);
  assert.equal(storage.records()[0].pending, null);
});

test("an ACK for a higher server revision does not confirm a different queued branch that was never sent", async () => {
  const storage = memoryStorage();
  let pending;
  const client = create({
    storage,
    fetcher: (_url, options) =>
      new Promise((resolve) => {
        pending = { payload: JSON.parse(options.body), resolve };
      }),
  });
  const first = client.flush(record());
  const firstRejected = assert.rejects(first, /다른 창/);
  await Promise.resolve();
  const second = client.flush(record(2, { choices: { account: "flex" } }));
  const secondRejected = assert.rejects(second, /다른 창/);
  pending.resolve(reply(pending.payload, { ackRevision: 3 }));
  await Promise.all([firstRejected, secondRejected]);
  assert.equal(client.state("session-one").status, "error");
  assert.equal(client.state("session-one").ackRevision, 0);
  assert.equal(client.state("session-one").pendingRevision, 2);
  assert.equal(storage.records()[0].pending.choices.account, "flex");
  assert.match(client.state("session-one").error, /다른 창/);
});

test("an ignored higher revision ACK cannot mark the submitted different body as saved", async () => {
  const storage = memoryStorage();
  const client = create({
    storage,
    fetcher: async (_url, options) => reply(JSON.parse(options.body), { ackRevision: 5, panelOutcome: "out", ignored: true }),
  });
  await assert.rejects(client.flush(record(2, { choices: { account: "flex" } })), /다른 창/);
  assert.equal(client.state("session-one").ackRevision, 0);
  assert.equal(client.state("session-one").status, "error");
  assert.equal(storage.records()[0].pending.choices.account, "flex");
});

test("an ignored terminal ACK with the same revision cannot confirm a different progress body", async () => {
  const storage = memoryStorage();
  const client = create({
    storage,
    fetcher: async (_url, options) => reply(JSON.parse(options.body), { panelOutcome: "out", ignored: true }),
  });
  await assert.rejects(client.flush(record()), /종료 상태/);
  assert.equal(client.state("session-one").pendingRevision, 1);
  assert.equal(client.state("session-one").ackRevision, 0);
});
