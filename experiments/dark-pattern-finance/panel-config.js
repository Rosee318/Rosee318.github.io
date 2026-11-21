/* 현재는 자사 임시 복귀 페이지를 사용하는 시험 설정입니다. 운영 주소가 오면 이 설정을 교체합니다. */
window.MOA_PANEL_CONFIG = Object.freeze({
  enabled: true,
  testMode: true,
  studyId: "finance-decision-20261120",
  completeReturnUrl: "https://saeromlee.kr/experiments/dark-pattern-finance/panel-return.html?mode=test",
  outReturnUrl: "https://saeromlee.kr/experiments/dark-pattern-finance/panel-return.html?mode=test",
  completeStatus: "TEMP_COMPLETE",
  outStatus: "TEMP_OUT",
  exitIsOut: true,
  redirectDelayMs: 1200,
  collectionUrl: "https://nwccyyusdztctpfrmszm.supabase.co/functions/v1/moafit-collect",
  collectionRequired: true,
});
