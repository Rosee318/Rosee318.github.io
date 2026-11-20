/* 패널사 연동. ID는 원문을 보존하며, 복귀 주소는 운영 설정 파일에서만 읽습니다. */
((root) => {
  "use strict";
  const outcomes = new Set(["complete", "out"]);

  function parseEntry(href) {
    const url = new URL(href);
    const values = url.searchParams.getAll("panel_id");
    const mode = values.length > 0 || url.searchParams.get("panel") === "1";
    let error = "";
    if (mode && values.length !== 1) error = "참여 정보가 올바르지 않습니다. 설문에서 제공한 링크로 다시 접속해 주세요.";
    const panelId = values.length === 1 ? values[0] : "";
    if (
      mode &&
      (!panelId || !panelId.trim() || panelId.length > 512 || /[\u0000-\u001f\u007f]/.test(panelId) || /^(?:\[ID\]|\{panel_id\})$/i.test(panelId))
    ) {
      error = "참여 정보를 확인할 수 없습니다. 설문에서 제공한 링크로 다시 접속해 주세요.";
    }
    return Object.freeze({ mode, panelId, error });
  }

  function trustedUrl(raw, label) {
    let url;
    try {
      url = new URL(raw);
    } catch (_) {
      throw new Error(`${label}가 아직 설정되지 않았습니다.`);
    }
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error(`${label} 설정을 확인해 주세요.`);
    if (/XXXX|\[ID\]|%5bID%5d|\{(?:ID|panel_id)\}|%7b(?:ID|panel_id)%7d/i.test(url.href)) throw new Error(`${label}에 예시 값이 남아 있습니다.`);
    url.hash = "";
    return url;
  }

  function route(config, outcome, panelId) {
    if (!outcomes.has(outcome)) throw new Error("처리할 수 없는 종료 상태입니다.");
    if (!config.enabled) throw new Error("설문 복귀 주소가 아직 확정되지 않았습니다.");
    const entry = parseEntry(`https://entry.invalid/?panel_id=${encodeURIComponent(panelId)}`);
    if (entry.error) throw new Error(entry.error);
    const status = outcome === "complete" ? config.completeStatus : config.outStatus;
    if (typeof status !== "string" || !status || status.length > 64 || /[\u0000-\u001f\u007f]/.test(status))
      throw new Error("설문 종료 코드가 아직 설정되지 않았습니다.");
    const destination = trustedUrl(outcome === "complete" ? config.completeReturnUrl : config.outReturnUrl, "설문 복귀 주소");
    destination.searchParams.set("panel_id", panelId);
    destination.searchParams.set("status", status);
    return { url: destination.href, status, outcome };
  }

  function create(options) {
    const config = Object.freeze({ ...(options.config || {}) });
    const entry = parseEntry(options.href);
    const fetcher = options.fetcher || root.fetch?.bind(root);
    const inFlight = new Map();
    const receipts = new Map();
    function getRoute(outcome = "complete") {
      if (entry.error) throw new Error(entry.error);
      return route(config, outcome, entry.panelId);
    }
    function configurationError(outcome = "complete") {
      try {
        getRoute(outcome);
        return "";
      } catch (error) {
        return error.message;
      }
    }
    async function submit(record, outcome) {
      const target = getRoute(outcome);
      if (record.panel_id !== entry.panelId || record.studyId !== config.studyId || !record.sessionId)
        throw new Error("참여 기록이 일치하지 않습니다. 설문 링크로 다시 접속해 주세요.");
      const key = `${config.studyId}:${record.sessionId}:${outcome}`;
      if (receipts.has(key)) return { ...target, ...receipts.get(key) };
      if (inFlight.has(key)) return inFlight.get(key);
      const request = (async () => {
        const result = { receiptId: null, collection: "browser" };
        if (config.collectionUrl) {
          const endpoint = trustedUrl(config.collectionUrl, "기록 수집 주소");
          if (endpoint.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname))
            throw new Error("기록 수집 주소는 HTTPS를 사용해야 합니다.");
          if (!fetcher) throw new Error("기록을 전송할 수 없는 브라우저입니다.");
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);
          try {
            const response = await fetcher(endpoint.href, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "omit",
              cache: "no-store",
              referrerPolicy: "no-referrer",
              signal: controller.signal,
              body: JSON.stringify({ ...record, panel_id: entry.panelId, panelOutcome: outcome, panelStatus: target.status, idempotencyKey: key }),
            });
            if (!response.ok) throw new Error("기록 저장을 확인하지 못했습니다. 다시 시도해 주세요.");
            const confirmation = await response.json();
            if (confirmation.ok !== true || typeof confirmation.receiptId !== "string" || !confirmation.receiptId)
              throw new Error("기록 저장을 확인하지 못했습니다. 다시 시도해 주세요.");
            result.receiptId = confirmation.receiptId;
            result.collection = "server";
          } catch (error) {
            if (error.name === "AbortError") throw new Error("기록 저장이 지연되고 있습니다. 다시 시도해 주세요.");
            throw error;
          } finally {
            clearTimeout(timeout);
          }
        } else if (config.collectionRequired) {
          throw new Error("기록 수집 주소가 아직 설정되지 않았습니다.");
        }
        receipts.set(key, result);
        return { ...target, ...result };
      })();
      inFlight.set(key, request);
      try {
        return await request;
      } finally {
        inFlight.delete(key);
      }
    }
    return Object.freeze({
      entry,
      studyId: String(config.studyId || ""),
      exitIsOut: config.exitIsOut === true,
      delayMs: Math.max(0, Math.min(10000, Number(config.redirectDelayMs) || 0)),
      configurationError,
      getRoute,
      submit,
    });
  }

  root.MoaPanelBridge = Object.freeze({ parseEntry, route, create });
})(typeof window === "undefined" ? globalThis : window);
