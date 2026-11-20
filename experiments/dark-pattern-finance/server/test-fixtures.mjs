export const TEST_SESSION = "79df5959-ce0f-4826-a049-41846c8f7236";
export const TEST_TOKEN = "a".repeat(64);
export const TEST_STUDY = "finance-decision-20261120";
export const COMPLETE_CHOICES = {
  account: "basic",
  loan: "none",
  portfolio: "none",
  plan: "basic",
  marketAlert: false,
  balanceReport: false,
  autoFx: "no",
  care: "no",
};
export function event(sequence, overrides = {}) {
  return {
    sequence,
    step: "이용할 통장",
    stepIndex: 1,
    action: "choice",
    value: { key: "account", value: "basic" },
    at: "2026-11-21T00:00:01.000Z",
    elapsedMs: 1000,
    ...overrides,
  };
}
export function fixture(overrides = {}) {
  return {
    studyId: TEST_STUDY,
    sessionId: TEST_SESSION,
    panel_id: "QA+&한글",
    revision: 1,
    writeToken: TEST_TOKEN,
    isTest: true,
    condition: "dark",
    appVersion: "2026-11-21.1",
    schemaVersion: 3,
    startedAt: "2026-11-21T00:00:00.000Z",
    completedAt: null,
    finalDecision: null,
    panelOutcome: "in_progress",
    panelStatus: null,
    totalMs: 1000,
    step: 1,
    visited: [1],
    choices: { account: "basic", loan: null, portfolio: null, plan: null, marketAlert: null, balanceReport: null, autoFx: null, care: null },
    initialChoices: { account: "basic" },
    events: [event(1)],
    ...overrides,
  };
}
