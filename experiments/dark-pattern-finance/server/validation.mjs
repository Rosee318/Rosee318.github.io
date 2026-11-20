export const MAX_PAYLOAD_BYTES = 512 * 1024;
export const MAX_EVENTS = 1500;
export const MAX_REVISION = 1_000_000_000;
export const MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export class ValidationError extends Error {
  constructor(message = "Invalid study record", status = 400) {
    super(message);
    this.name = "ValidationError";
    this.code = "INVALID_PAYLOAD";
    this.status = status;
  }
}

const CHOICES = Object.freeze({
  account: ["flex", "basic", null],
  loan: ["A", "B", "none", null],
  portfolio: ["growth", "balance", "none", null],
  plan: ["basic", "plus", null],
  marketAlert: [true, false, null],
  balanceReport: [true, false, null],
  autoFx: ["yes", "no", null],
  care: ["yes", "no", null],
});
const COST_KEYS = Object.freeze([
  "principal",
  "months",
  "loanRate",
  "monthlyLoan",
  "loanInterestTotal",
  "upfrontFee",
  "planFee",
  "addonFee",
  "recurringFee",
  "annualServiceFee",
  "monthlyTotal",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL = /[\u0000-\u001f\u007f]/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const BLOCKED_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "ip",
  "ipaddress",
  "ip_address",
  "useragent",
  "user_agent",
  "ua",
  "email",
  "phone",
  "referrer",
  "referer",
  "cookie",
  "authorization",
  "writetoken",
  "writetokenhash",
]);

function fail(field) {
  throw new ValidationError(`Invalid ${field}`);
}

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(field);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail(field);
  return value;
}

function integer(value, field, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(field);
  return value;
}

function text(value, field, max, { empty = false } = {}) {
  if (typeof value !== "string" || value.length > max || CONTROL.test(value) || (!empty && !value.trim())) fail(field);
  return value;
}

function timestamp(value, field, nullable = false) {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || !ISO_UTC.test(value)) fail(field);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value || parsed.getUTCFullYear() < 1970 || parsed.getUTCFullYear() > 2100)
    fail(field);
  return value;
}

function choiceMap(value, field, partial = false) {
  object(value, field);
  const result = {};
  for (const [key, allowed] of Object.entries(CHOICES)) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      if (!partial) result[key] = null;
      continue;
    }
    if (!allowed.includes(value[key])) fail(`${field}.${key}`);
    result[key] = value[key];
  }
  return result;
}

function jsonValue(value, depth = 0) {
  if (depth > 7) fail("event value depth");
  if (value === null) return null;
  if (typeof value === "string") return text(value, "event value", 8192, { empty: true });
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Math.abs(value) > 1_000_000_000_000) fail("event number");
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > 256) fail("event array");
    return value.map((item) => jsonValue(item, depth + 1));
  }
  object(value, "event value");
  const entries = Object.entries(value);
  if (entries.length > 64) fail("event object");
  const result = {};
  for (const [key, item] of entries) {
    text(key, "event key", 96);
    if (BLOCKED_KEYS.has(key.toLowerCase())) continue;
    result[key] = jsonValue(item, depth + 1);
  }
  return result;
}

function eventList(value) {
  if (!Array.isArray(value) || value.length > MAX_EVENTS) fail("events");
  return value.map((item, index) => {
    object(item, "event");
    if (integer(item.sequence, "event sequence", 1, MAX_EVENTS) !== index + 1) fail("event sequence continuity");
    const action = text(item.action, "event action", 64);
    if (!/^[a-z][a-z0-9_-]*$/.test(action)) fail("event action");
    return {
      sequence: item.sequence,
      step: text(item.step, "event step", 96),
      stepIndex: integer(item.stepIndex, "event step index", 0, 9),
      action,
      value: item.value === undefined ? null : jsonValue(item.value),
      at: timestamp(item.at, "event timestamp"),
      elapsedMs: integer(item.elapsedMs, "event elapsed time", 0, MAX_DURATION_MS),
    };
  });
}

function costs(value) {
  if (value === undefined || value === null) return null;
  object(value, "cost snapshot");
  const result = {};
  for (const key of COST_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    const amount = value[key];
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000_000) fail(`cost ${key}`);
    result[key] = amount;
  }
  return result;
}

/** Validate a complete cumulative snapshot. No request metadata is copied into the record. */
export function validatePayload(input, { studyId, forceTest = true } = {}) {
  object(input, "record");
  let encoded;
  try {
    encoded = JSON.stringify(input);
  } catch (_) {
    fail("JSON record");
  }
  if (new TextEncoder().encode(encoded).byteLength > MAX_PAYLOAD_BYTES) fail("record size");
  if (typeof studyId !== "string" || !studyId || input.studyId !== studyId) fail("study ID");
  const sessionId = text(input.sessionId, "session ID", 36);
  if (!UUID.test(sessionId)) fail("session ID");
  const writeToken = text(input.writeToken, "write token", 128);
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(writeToken)) fail("write token");
  const isTest = forceTest !== false;
  const panelId = input.panel_id;
  if (panelId === null) {
    if (!isTest) fail("panel ID");
  } else {
    text(panelId, "panel ID", 512);
    if (/^(?:\[ID\]|\{panel_id\})$/i.test(panelId)) fail("panel ID");
  }
  if (!["dark", "neutral"].includes(input.condition)) fail("condition");
  const panelOutcome = input.panelOutcome;
  if (!["in_progress", "complete", "out"].includes(panelOutcome)) fail("panel outcome");
  const finalDecision = input.finalDecision === undefined ? null : input.finalDecision;
  if (panelOutcome === "complete") {
    if (!["apply", "decline"].includes(finalDecision)) fail("final decision");
  } else if (finalDecision !== null) fail("final decision");
  const startedAt = timestamp(input.startedAt, "start timestamp");
  const completedAt = timestamp(input.completedAt ?? null, "completion timestamp", panelOutcome === "in_progress");
  if (panelOutcome === "in_progress" && completedAt !== null) fail("progress completion timestamp");
  if (completedAt !== null && completedAt < startedAt) fail("completion timestamp order");
  const panelStatus = input.panelStatus ?? null;
  if (panelStatus !== null) text(panelStatus, "panel status", 64);
  if (panelOutcome === "in_progress" && panelStatus !== null) fail("progress panel status");
  const visited = input.visited ?? [];
  if (!Array.isArray(visited) || visited.length > 8 || new Set(visited).size !== visited.length) fail("visited steps");
  visited.forEach((step) => integer(step, "visited step", 1, 8));
  const appVersion = input.appVersion === undefined ? null : text(input.appVersion, "app version", 64);
  const schemaVersion = input.schemaVersion === undefined ? null : integer(input.schemaVersion, "schema version", 1, 1000);
  const events = eventList(input.events);
  const choices = choiceMap(input.choices, "choices");
  const step = integer(input.step, "step", 0, 9);
  if (panelOutcome === "complete") {
    const decisions = events.filter((event) => event.action === "final_decision");
    if (
      ![8, 9].includes(step) ||
      visited.length !== 8 ||
      Object.values(choices).some((value) => value === null) ||
      decisions.length !== 1 ||
      decisions[0].value?.decision !== finalDecision
    )
      fail("completed experience");
  }
  return {
    studyId,
    sessionId,
    panel_id: panelId,
    revision: integer(input.revision, "revision", 1, MAX_REVISION),
    writeToken,
    condition: input.condition,
    isTest,
    startedAt,
    completedAt,
    finalDecision,
    panelOutcome,
    panelStatus,
    events,
    choices,
    initialChoices: choiceMap(input.initialChoices ?? {}, "initial choices", true),
    totalMs: integer(input.totalMs, "total elapsed time", 0, MAX_DURATION_MS),
    step,
    visited: visited.slice(),
    appVersion,
    schemaVersion,
    costSnapshot: costs(input.costSnapshot),
  };
}
