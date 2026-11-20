(() => {
  "use strict";
  const query = new URLSearchParams(location.search);
  const config = window.MOA_PANEL_CONFIG || {};
  const code = query.get("status") || "";
  const panelId = query.get("panel_id") || "";
  const receipt = query.get("receipt_id") || "";
  const outcome = code && code === config.completeStatus ? "complete" : code && code === config.outStatus ? "out" : "unknown";
  document.getElementById("return-panel-id").textContent = panelId || "전달된 참여번호 없음";
  document.getElementById("return-code").textContent = code || "전달된 코드 없음";
  document.getElementById("return-receipt").textContent =
    receipt || (config.collectionUrl ? "저장 확인 번호가 전달되지 않았습니다." : "수집 서버 연결 전 시험 단계");
  document.getElementById("return-outcome").textContent =
    outcome === "complete" ? "체험 완료" : outcome === "out" ? "체험 중단 · 아웃" : "확인할 수 없음";
  document.getElementById("return-heading").textContent =
    outcome === "complete" ? "완료 상태가 전달되었습니다." : outcome === "out" ? "아웃 상태가 전달되었습니다." : "전달된 값을 확인해 주세요.";
  if (!panelId || outcome === "unknown" || (!receipt && config.collectionUrl)) {
    const error = document.getElementById("return-error");
    error.hidden = false;
    error.textContent = "이 주소만 직접 여는 것으로는 데이터 저장을 확인할 수 없습니다. 체험 시작 링크부터 진행해 주세요.";
  } else if (!receipt) {
    const notice = document.getElementById("return-error");
    notice.hidden = false;
    notice.className = "notice blue";
    notice.textContent = "현재 서버 연결 전 시험 단계입니다. 체험 기록은 이용한 기기에 보관되며, 서버 저장 확인 번호는 생성되지 않습니다.";
  }
})();
