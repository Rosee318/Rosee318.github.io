import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePayload, ValidationError, MAX_EVENTS, MAX_PAYLOAD_BYTES } from "./validation.mjs";
import { COMPLETE_CHOICES } from "./test-fixtures.mjs";

const config = { studyId: "finance-decision-20261120" };
const startedAt = "2026-11-21T01:02:03.000Z";
const completedAt = "2026-11-21T01:03:03.000Z";
const event = (sequence) => ({ sequence, step: "시작", stepIndex: 0, action: "session_start", value: null, at: startedAt, elapsedMs: 0 });
const record = () => ({
  studyId: config.studyId,
  sessionId: "a4df1956-9cfa-4c3a-881b-5608353cbeca",
  panel_id: "P001",
  revision: 1,
  writeToken: "1".repeat(64),
  condition: "dark",
  isTest: true,
  startedAt,
  completedAt: null,
  finalDecision: null,
  panelOutcome: "in_progress",
  panelStatus: null,
  choices: { account: null, loan: null, portfolio: null, plan: null, marketAlert: null, balanceReport: null, autoFx: null, care: null },
  initialChoices: {},
  events: [event(1)],
  totalMs: 1000,
  step: 0,
  visited: [],
  appVersion: "2026-11-21.1",
  schemaVersion: 3,
});
const rejects = (value) => assert.throws(() => validatePayload(value, config), ValidationError);
const completed = () => ({
  ...record(),
  panelOutcome: "complete",
  finalDecision: "decline",
  completedAt,
  panelStatus: "TEST_COMPLETE",
  choices: { ...COMPLETE_CHOICES },
  step: 9,
  visited: [1, 2, 3, 4, 5, 6, 7, 8],
  events: [{ ...event(1), action: "final_decision", value: { decision: "decline" } }],
});

test("preserves the panel ID exactly, including whitespace and URL punctuation", () => {
  const input = record();
  input.panel_id = " ID+&한글/%?# ";
  assert.equal(validatePayload(input, config).panel_id, input.panel_id);
});

test("pilot classification is server-owned and anonymous preview records are accepted only in pilot", () => {
  const input = record();
  input.panel_id = null;
  input.isTest = false;
  assert.equal(validatePayload(input, config).isTest, true);
  assert.throws(() => validatePayload(input, { ...config, forceTest: false }), ValidationError);
  input.panel_id = "LIVE01";
  input.isTest = true;
  assert.equal(validatePayload(input, { ...config, forceTest: false }).isTest, false);
});

test("drops unknown request metadata and nested IP/UA fields", () => {
  const input = record();
  input.ip = "127.0.0.1";
  input.userAgent = "unrequested";
  input.events[0].value = { condition: "dark", ip: "127.0.0.1", user_agent: "unrequested", nested: { email: "test@example.test", keep: true } };
  const clean = validatePayload(input, config);
  assert.equal(Object.hasOwn(clean, "ip"), false);
  assert.equal(Object.hasOwn(clean, "userAgent"), false);
  assert.deepEqual(clean.events[0].value, { condition: "dark", nested: { keep: true } });
});

test("rejects another study and malformed session credentials", () => {
  for (const changes of [
    { studyId: "another-study" },
    { sessionId: "not-a-uuid" },
    { sessionId: "00000000-0000-0000-0000-000000000000" },
    { writeToken: "short" },
    { writeToken: " ".repeat(64) },
  ])
    rejects({ ...record(), ...changes });
});

test("rejects absent, placeholder, control, empty and oversized panel IDs without truncation", () => {
  for (const panelId of [undefined, "", " ", "[ID]", "{panel_id}", "A\nB", "A".repeat(513)]) rejects({ ...record(), panel_id: panelId });
});

test("validates revision and elapsed time bounds", () => {
  for (const changes of [{ revision: 0 }, { revision: 1.5 }, { revision: 1_000_000_001 }, { totalMs: -1 }, { totalMs: 604800001 }])
    rejects({ ...record(), ...changes });
});

test("requires cumulative event sequences to be continuous from one", () => {
  for (const events of [[event(2)], [event(1), event(3)], [event(1), event(1)], [event(2), event(1)]]) rejects({ ...record(), events });
  assert.equal(validatePayload({ ...record(), events: [] }, config).events.length, 0);
  assert.equal(validatePayload({ ...record(), events: [event(1), event(2)] }, config).events.length, 2);
});

test("rejects excessive event arrays and invalid event scalar types", () => {
  rejects({ ...record(), events: Array.from({ length: MAX_EVENTS + 1 }, (_, index) => event(index + 1)) });
  for (const changes of [{ stepIndex: 10 }, { elapsedMs: -1 }, { action: "<script>" }, { at: "not-date" }])
    rejects({ ...record(), events: [{ ...event(1), ...changes }] });
});

test("only canonical, real UTC timestamps are accepted", () => {
  for (const invalid of [
    "2026-02-30T01:02:03.000Z",
    "2026-11-21T01:02:03Z",
    "2026-11-21T01:02:03.000+00:00",
    "1969-12-31T23:59:59.999Z",
    "2101-01-01T00:00:00.000Z",
  ])
    rejects({ ...record(), startedAt: invalid });
});

test("a completed full rejection is a legitimate completed session", () => {
  const clean = validatePayload(completed(), config);
  assert.equal(clean.panelOutcome, "complete");
  assert.equal(clean.finalDecision, "decline");
});

test("a complete record requires the full experience and one matching final decision event", () => {
  assert.equal(validatePayload({ ...completed(), step: 8 }, config).step, 8);
  for (const changes of [
    { step: 0 },
    { visited: [] },
    { choices: {} },
    { events: [] },
    { events: [{ ...event(1), action: "final_decision", value: { decision: "apply" } }] },
  ])
    rejects({ ...completed(), ...changes });
});

test("out requires no financial decision and completion time; progress cannot impersonate terminal state", () => {
  assert.equal(validatePayload({ ...record(), panelOutcome: "out", completedAt, panelStatus: "TEST_OUT" }, config).panelOutcome, "out");
  for (const changes of [
    { panelOutcome: "complete", completedAt },
    { panelOutcome: "complete", finalDecision: "apply", completedAt: null },
    { panelOutcome: "out", finalDecision: "decline", completedAt },
    { completedAt },
    { panelStatus: "TEST_COMPLETE" },
    { panelOutcome: "complete", finalDecision: "apply", completedAt: "2026-11-21T01:02:02.000Z" },
  ])
    rejects({ ...record(), ...changes });
});

test("choice keys are filtered and choice values retain null/false distinction", () => {
  const input = record();
  input.choices.marketAlert = false;
  input.choices.email = "discard";
  input.initialChoices.marketAlert = true;
  const clean = validatePayload(input, config);
  assert.equal(clean.choices.marketAlert, false);
  assert.equal(clean.choices.balanceReport, null);
  assert.equal(Object.hasOwn(clean.choices, "email"), false);
  assert.deepEqual(clean.initialChoices, { marketAlert: true });
  for (const changes of [{ loan: "Z" }, { marketAlert: "false" }, { care: true }])
    rejects({ ...record(), choices: { ...record().choices, ...changes } });
});

test("costs are numeric, finite, nonnegative and limited to known fields", () => {
  const clean = validatePayload({ ...record(), costSnapshot: { principal: 3000000, monthlyLoan: 89240.7734, unrequested: "discard" } }, config);
  assert.deepEqual(clean.costSnapshot, { principal: 3000000, monthlyLoan: 89240.7734 });
  for (const value of [-1, Infinity, "100", 1_000_000_000_001]) rejects({ ...record(), costSnapshot: { principal: value } });
});

test("rejects oversized, circular, unsafe nested data and invalid step metadata", () => {
  const huge = record();
  huge.unrequested = "가".repeat(MAX_PAYLOAD_BYTES / 2);
  rejects(huge);
  const circular = record();
  circular.extra = circular;
  rejects(circular);
  const deep = record();
  deep.events[0].value = { a: { b: { c: { d: { e: { f: { g: { h: {} } } } } } } } };
  rejects(deep);
  rejects({ ...record(), step: 10 });
  rejects({ ...record(), visited: [1, 1] });
  rejects({ ...record(), visited: [0] });
});

test("does not mutate input data and errors never echo supplied sensitive content", () => {
  const input = record();
  const before = JSON.stringify(input);
  validatePayload(input, config);
  assert.equal(JSON.stringify(input), before);
  assert.throws(
    () => validatePayload({ ...input, panel_id: "private@example.test\n" }, config),
    (error) => error instanceof ValidationError && !error.message.includes("private@example")
  );
});
