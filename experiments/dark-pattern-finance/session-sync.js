/* 체험 기록 자동저장. 미확인 요청과 세션별 쓰기 토큰은 해당 브라우저에만 보관합니다. */
((root) => {
  "use strict";
  const TERMINAL = new Set(["complete", "out"]);
  const OUTCOMES = new Set(["in_progress", "complete", "out"]);
  const MAX_PENDING = 30;
  const MAX_BYTES = 512 * 1024;
  const KEEPALIVE_BYTES = 60 * 1024;
  const SCHEMA_VERSION = 1;
  const CHOICE_KEYS = ["account", "loan", "portfolio", "plan", "marketAlert", "balanceReport", "autoFx", "care"];
  const COST_KEYS = [
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
  ];
  const BLOCKED_EVENT_KEYS = new Set([
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

  function stable(value) {
    return JSON.stringify(value, (_key, item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, item[key]])
          )
        : item
    );
  }

  function eventValue(value) {
    if (Array.isArray(value)) return value.map(eventValue);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !BLOCKED_EVENT_KEYS.has(key.toLowerCase()))
        .map(([key, item]) => [key, eventValue(item)])
    );
  }

  // Match server/validation.mjs's stored fields; panelReturn, recordedIn and other transport metadata are deliberately excluded.
  // Keep exact canonical JSON rather than a lossy hash, so a changed selection or event can never reuse an unrelated ACK.
  function fingerprint(record) {
    const choices = Object.fromEntries(CHOICE_KEYS.map((key) => [key, record.choices?.[key] ?? null]));
    const initialChoices = Object.fromEntries(
      CHOICE_KEYS.filter((key) => Object.hasOwn(record.initialChoices || {}, key)).map((key) => [key, record.initialChoices[key]])
    );
    return stable({
      studyId: record.studyId,
      sessionId: record.sessionId,
      panel_id: record.panel_id,
      revision: record.revision,
      condition: record.condition,
      startedAt: record.startedAt,
      completedAt: record.completedAt ?? null,
      finalDecision: record.finalDecision ?? null,
      panelOutcome: record.panelOutcome || "in_progress",
      panelStatus: record.panelStatus ?? null,
      choices,
      initialChoices,
      totalMs: record.totalMs,
      step: record.step,
      visited: record.visited ?? [],
      appVersion: record.appVersion ?? null,
      schemaVersion: record.schemaVersion ?? null,
      costSnapshot:
        record.costSnapshot == null
          ? null
          : Object.fromEntries(COST_KEYS.filter((key) => Object.hasOwn(record.costSnapshot, key)).map((key) => [key, record.costSnapshot[key]])),
      events: record.events.map((event) => ({
        sequence: event.sequence,
        step: event.step,
        stepIndex: event.stepIndex,
        action: event.action,
        value: event.value === undefined ? null : eventValue(event.value),
        at: event.at,
        elapsedMs: event.elapsedMs,
      })),
    });
  }

  function create(options) {
    if (!options || typeof options.studyId !== "string" || !options.studyId || options.studyId.length > 128)
      throw new Error("기록 저장의 조사 번호를 확인해 주세요.");
    const studyId = options.studyId;
    const key = `moafit-session-sync-v1:${studyId}`;
    let storage;
    try {
      storage = options.storage || root.localStorage;
    } catch (_) {
      throw new Error("이 브라우저에서는 기록을 보관할 수 없습니다. 저장 기능을 허용한 뒤 다시 접속해 주세요.");
    }
    if (
      !storage ||
      typeof storage.getItem !== "function" ||
      typeof storage.setItem !== "function" ||
      typeof storage.removeItem !== "function" ||
      typeof storage.key !== "function" ||
      !Number.isInteger(storage.length)
    )
      throw new Error("이 브라우저에서는 기록을 보관할 수 없습니다. 저장 기능을 허용한 뒤 다시 접속해 주세요.");
    const fetcher = options.fetcher || root.fetch?.bind(root);
    const isTest = options.isTest !== false;
    const debounceMs = Number.isFinite(options.debounceMs) ? Math.max(0, options.debounceMs) : 500;
    const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(1, options.timeoutMs) : 12000;
    const endpoint = parseEndpoint(options.endpoint || "");
    const entries = new Map();
    const statuses = new Map();
    const timers = new Map();
    const pumps = new Map();
    let durable = true;
    let storageWarning = "";
    restore();

    function parseEndpoint(value) {
      if (!value) return "";
      let url;
      try {
        url = new URL(value);
      } catch (_) {
        throw new Error("기록 수집 주소를 확인해 주세요.");
      }
      if (
        url.username ||
        url.password ||
        (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
      )
        throw new Error("기록 수집에는 안전한 HTTPS 주소가 필요합니다.");
      url.hash = "";
      return url.href;
    }

    function sessionKey(sessionId) {
      return `${key}:session:${encodeURIComponent(sessionId)}`;
    }

    function readSaved(text) {
      let saved;
      try {
        saved = JSON.parse(text);
      } catch (_) {
        throw new Error("보관한 체험 기록을 확인할 수 없습니다. 기록을 지우지 말고 조사 담당자에게 문의해 주세요.");
      }
      if (!saved || saved.schemaVersion !== SCHEMA_VERSION || saved.studyId !== studyId || !Array.isArray(saved.entries))
        throw new Error("보관한 체험 기록의 형식이 다릅니다. 기록을 지우지 말고 조사 담당자에게 문의해 주세요.");
      return saved.entries;
    }

    function restore(onlyMissing = false) {
      const stored = [];
      let legacy;
      try {
        legacy = storage.getItem(key);
        if (legacy) stored.push(...readSaved(legacy));
        const keys = [];
        for (let index = 0; index < storage.length; index += 1) {
          const storedKey = storage.key(index);
          if (storedKey?.startsWith(`${key}:session:`)) keys.push(storedKey);
        }
        for (const storedKey of keys) {
          const text = storage.getItem(storedKey);
          if (text) stored.push(...readSaved(text));
        }
      } catch (error) {
        if (error.message.includes("지우지 말고")) throw error;
        throw new Error("보관한 체험 기록을 읽을 수 없습니다. 이 창을 유지하고 조사 담당자에게 문의해 주세요.");
      }
      for (const item of stored) {
        if (
          !item ||
          typeof item.sessionId !== "string" ||
          !item.sessionId ||
          typeof item.writeToken !== "string" ||
          !/^[a-f0-9]{64}$/.test(item.writeToken)
        )
          throw new Error("보관한 체험 기록을 확인할 수 없습니다. 기록을 지우지 말고 조사 담당자에게 문의해 주세요.");
        if (item.pending) validateRecord(item.pending);
        if (entries.has(item.sessionId) && onlyMissing) continue;
        if (entries.has(item.sessionId) && entries.get(item.sessionId).writeToken !== item.writeToken)
          throw new Error("보관한 체험 기록이 서로 다릅니다. 기록을 지우지 말고 조사 담당자에게 문의해 주세요.");
        const entry = {
          ...item,
          ackRevision: Number.isSafeInteger(item.ackRevision) ? item.ackRevision : 0,
          lastEventSequence: Number.isSafeInteger(item.lastEventSequence) ? item.lastEventSequence : 0,
        };
        entries.set(entry.sessionId, entry);
        statuses.set(entry.sessionId, entry.pending ? (endpoint ? "queued" : "not_configured") : "saved");
      }
      if ([...entries.values()].filter((entry) => entry.pending).length > MAX_PENDING)
        throw new Error("보관 중인 체험 기록이 너무 많습니다. 기록을 지우지 말고 조사 담당자에게 문의해 주세요.");
      if (legacy && !onlyMissing) {
        for (const entry of entries.values()) persist(entry);
        storage.removeItem(key);
      }
    }

    function persist(entry, strict = true, acknowledgedRecord = null) {
      try {
        const currentText = storage.getItem(sessionKey(entry.sessionId));
        if (currentText) {
          const current = readSaved(currentText)[0];
          if (!current) throw new Error("보관한 체험 기록을 확인할 수 없습니다. 기록을 지우지 말고 조사 담당자에게 문의해 주세요.");
          if (current.writeToken !== entry.writeToken || current.panelId !== entry.panelId)
            throw new Error("다른 창의 체험 기록과 일치하지 않습니다. 이 창을 유지하고 조사 담당자에게 문의해 주세요.");
          if (acknowledgedRecord && current.pending && current.pending.revision <= acknowledgedRecord.revision) {
            if (fingerprint(current.pending) !== fingerprint(acknowledgedRecord))
              throw new Error("다른 창에서 같은 체험을 수정하고 있습니다. 이 창을 유지하고 조사 담당자에게 문의해 주세요.");
          }
          adoptAck(entry, current);
          if (current.pending && (!entry.pending || current.pending.revision > entry.pending.revision)) entry.pending = current.pending;
          if (
            current.pending &&
            entry.pending &&
            current.pending.revision === entry.pending.revision &&
            fingerprint(current.pending) !== fingerprint(entry.pending)
          )
            throw new Error("다른 창에서 같은 체험을 수정하고 있습니다. 이 창을 유지하고 조사 담당자에게 문의해 주세요.");
          if (entry.pending && covers(entry, entry.pending)) {
            if (!confirmed(entry, entry.pending) && (!acknowledgedRecord || fingerprint(entry.pending) !== fingerprint(acknowledgedRecord)))
              throw new Error("다른 창에서 같은 체험을 수정하고 있습니다. 이 창을 유지하고 조사 담당자에게 문의해 주세요.");
            entry.pending = null;
          }
          if (entry.pending && TERMINAL.has(entry.ackOutcome) && entry.pending.panelOutcome !== entry.ackOutcome)
            throw new Error("이미 끝난 체험의 종료 상태를 바꿀 수 없습니다.");
        }
        storage.setItem(sessionKey(entry.sessionId), JSON.stringify({ schemaVersion: SCHEMA_VERSION, studyId, entries: [entry] }));
        durable = true;
        storageWarning = "";
      } catch (error) {
        durable = false;
        storageWarning = /다른 창|종료 상태|지우지 말고/.test(error.message)
          ? error.message
          : "기기 저장 공간이 부족하거나 저장이 차단되어 있습니다. 이 창을 닫지 말고 다시 시도해 주세요.";
        if (strict) throw new Error(storageWarning);
      }
    }

    function token() {
      if (!root.crypto || typeof root.crypto.getRandomValues !== "function")
        throw new Error("안전한 기록 저장을 지원하는 브라우저로 다시 접속해 주세요.");
      return [...root.crypto.getRandomValues(new Uint8Array(32))].map((value) => value.toString(16).padStart(2, "0")).join("");
    }

    function lastSequence(record) {
      return record.events.length ? record.events[record.events.length - 1].sequence : 0;
    }

    function validateRecord(record) {
      if (
        !record ||
        record.studyId !== studyId ||
        typeof record.sessionId !== "string" ||
        !record.sessionId ||
        record.sessionId.length > 128 ||
        !Number.isSafeInteger(record.revision) ||
        record.revision < 1
      )
        throw new Error("체험 기록의 조사·세션 번호를 확인해 주세요.");
      if (
        record.panel_id !== null &&
        (typeof record.panel_id !== "string" || !record.panel_id || record.panel_id.length > 512 || /[\u0000-\u001f\u007f]/.test(record.panel_id))
      )
        throw new Error("체험 기록의 참여 번호를 확인해 주세요.");
      if (!OUTCOMES.has(record.panelOutcome || "in_progress") || !Array.isArray(record.events) || record.events.length > 1500)
        throw new Error("체험 기록의 상태나 행동 기록을 확인해 주세요.");
      let previous = 0;
      for (const event of record.events) {
        if (!event || !Number.isSafeInteger(event.sequence) || event.sequence <= previous) throw new Error("행동 기록의 순서를 확인해 주세요.");
        previous = event.sequence;
      }
    }

    function state(sessionId) {
      const entry = entries.get(sessionId);
      return Object.freeze({
        sessionId,
        status: entry ? statuses.get(sessionId) || (entry.pending ? "queued" : "saved") : "idle",
        ackRevision: entry?.ackRevision || 0,
        lastEventSequence: entry?.lastEventSequence || 0,
        pendingRevision: entry?.pending?.revision || null,
        receiptId: entry?.receiptId || null,
        panelOutcome: entry?.ackOutcome || "in_progress",
        error: entry?.error || "",
        durable,
        warning: storageWarning,
      });
    }

    function notify(entry, status, error = "") {
      statuses.set(entry.sessionId, status);
      entry.error = error;
      if (typeof options.onStateChange === "function") {
        try {
          options.onStateChange(state(entry.sessionId));
        } catch (_) {
          /* A display callback must not alter the save result. */
        }
      }
    }

    function adoptAck(entry, current) {
      if (current.ackRevision > entry.ackRevision) {
        entry.ackRevision = current.ackRevision;
        entry.lastEventSequence = current.lastEventSequence;
        entry.ackOutcome = current.ackOutcome;
        entry.receiptId = current.receiptId;
        entry.ackFingerprint = current.ackFingerprint || null;
      } else if (current.ackRevision === entry.ackRevision && !entry.ackFingerprint && current.ackFingerprint) {
        entry.ackFingerprint = current.ackFingerprint;
      }
    }

    function confirmed(entry, record) {
      return entry.ackRevision === record.revision && entry.ackFingerprint === fingerprint(record);
    }

    function conflict(entry) {
      const error = new Error("다른 창의 체험 기록과 일치하지 않아 저장을 확인할 수 없습니다. 이 창을 유지하고 조사 담당자에게 문의해 주세요.");
      notify(entry, "error", error.message);
      throw error;
    }

    function enqueue(record) {
      restore(true);
      validateRecord(record);
      let copy;
      try {
        copy = JSON.parse(JSON.stringify(record));
      } catch (_) {
        throw new Error("체험 기록을 저장할 수 있는 형식으로 바꾸지 못했습니다.");
      }
      copy.panelOutcome = copy.panelOutcome || "in_progress";
      let entry = entries.get(copy.sessionId);
      if (entry && entry.panelId !== copy.panel_id) throw new Error("다른 참여자의 기록과 섞일 수 있어 저장을 중단했습니다.");
      if (entry) {
        const text = storage.getItem(sessionKey(entry.sessionId));
        if (text) {
          const current = readSaved(text)[0];
          if (!current || current.panelId !== entry.panelId || current.writeToken !== entry.writeToken) conflict(entry);
          adoptAck(entry, current);
        }
        if (entry.pending && confirmed(entry, entry.pending)) entry.pending = null;
      }
      const establishedOutcome = entry?.pending?.panelOutcome || entry?.ackOutcome;
      if (TERMINAL.has(establishedOutcome) && copy.panelOutcome !== establishedOutcome)
        throw new Error("이미 끝난 체험의 종료 상태를 바꿀 수 없습니다.");
      if (entry && copy.revision <= entry.ackRevision) {
        if (!confirmed(entry, copy)) conflict(entry);
        if (!entry.pending) notify(entry, "saved");
        return state(copy.sessionId);
      }
      if (entry?.pending && copy.revision <= entry.pending.revision) {
        if (fingerprint(copy) !== fingerprint(entry.pending)) conflict(entry);
        notify(entry, endpoint ? "queued" : "not_configured");
        return state(copy.sessionId);
      }
      if (!entry?.pending && [...entries.values()].filter((item) => item.pending).length >= MAX_PENDING)
        throw new Error("전송하지 못한 체험 기록이 30건입니다. 먼저 보관 기록을 전송한 뒤 다시 시도해 주세요.");
      if (!entry) {
        entry = {
          sessionId: copy.sessionId,
          panelId: copy.panel_id,
          writeToken: token(),
          ackRevision: 0,
          lastEventSequence: 0,
          ackOutcome: "in_progress",
          ackFingerprint: null,
          receiptId: null,
          pending: null,
          error: "",
        };
        entries.set(copy.sessionId, entry);
      }
      const body = JSON.stringify({ ...copy, writeToken: entry.writeToken, isTest });
      if (new TextEncoder().encode(body).byteLength > MAX_BYTES)
        throw new Error("체험 기록의 크기가 저장 한도를 넘었습니다. 이 창을 유지하고 조사 담당자에게 문의해 주세요.");
      entry.pending = copy;
      entry.updatedAt = new Date().toISOString();
      try {
        persist(entry);
      } catch (error) {
        notify(entry, "error", error.message);
        throw error;
      }
      notify(entry, endpoint ? "queued" : "not_configured");
      clearTimeout(timers.get(copy.sessionId));
      if (endpoint)
        timers.set(
          copy.sessionId,
          setTimeout(() => {
            timers.delete(copy.sessionId);
            ensurePump(copy.sessionId).catch(() => {});
          }, debounceMs)
        );
      return state(copy.sessionId);
    }

    function validateAck(confirmation, record) {
      const targetOutcome = record.panelOutcome;
      if (confirmation?.ok === true && confirmation.sessionId === record.sessionId && confirmation.ackRevision > record.revision)
        throw new Error("다른 창에서 더 최근 기록을 저장했습니다. 이 요청의 저장을 확인할 수 없어 중단했습니다. 조사 담당자에게 문의해 주세요.");
      if (
        !confirmation ||
        confirmation.ok !== true ||
        confirmation.sessionId !== record.sessionId ||
        typeof confirmation.receiptId !== "string" ||
        !confirmation.receiptId ||
        !Number.isSafeInteger(confirmation.ackRevision) ||
        confirmation.ackRevision !== record.revision ||
        !Number.isSafeInteger(confirmation.lastEventSequence) ||
        confirmation.lastEventSequence < lastSequence(record) ||
        !OUTCOMES.has(confirmation.panelOutcome) ||
        (confirmation.studyId !== undefined && confirmation.studyId !== studyId)
      )
        throw new Error("기록 저장 확인 정보가 일치하지 않습니다. 다시 시도해 주세요.");
      if (confirmation.panelOutcome !== targetOutcome)
        throw new Error("서버의 체험 종료 상태가 다릅니다. 이 창을 유지하고 조사 담당자에게 문의해 주세요.");
      return confirmation;
    }

    async function send(entry, record, keepalive) {
      if (!fetcher) throw new Error("기록을 전송할 수 없는 브라우저입니다.");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const body = JSON.stringify({ ...record, writeToken: entry.writeToken, isTest });
      try {
        const response = await fetcher(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
          mode: "cors",
          cache: "no-store",
          referrerPolicy: "no-referrer",
          signal: controller.signal,
          keepalive: !!keepalive && new TextEncoder().encode(body).byteLength < KEEPALIVE_BYTES,
          body,
        });
        if (!response.ok) throw new Error("기록 저장을 확인하지 못했습니다. 다시 시도해 주세요.");
        return validateAck(await response.json(), record);
      } catch (error) {
        if (error.name === "AbortError") throw new Error("기록 저장이 지연되고 있습니다. 다시 시도해 주세요.");
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    function covers(entry, record) {
      return (
        entry.ackRevision >= record.revision &&
        entry.lastEventSequence >= lastSequence(record) &&
        (!TERMINAL.has(record.panelOutcome) || entry.ackOutcome === record.panelOutcome)
      );
    }

    function ensurePump(sessionId, keepalive = false) {
      if (pumps.has(sessionId)) return pumps.get(sessionId);
      const entry = entries.get(sessionId);
      if (!entry?.pending) return Promise.resolve(state(sessionId));
      if (!endpoint) {
        notify(entry, "not_configured", "기록 수집 서버가 아직 연결되지 않았습니다.");
        return Promise.reject(new Error(entry.error));
      }
      const pump = Promise.resolve()
        .then(async () => {
          while (entry.pending) {
            const record = entry.pending;
            if (TERMINAL.has(entry.ackOutcome) && record.panelOutcome !== entry.ackOutcome)
              throw new Error("이미 끝난 체험의 종료 상태를 바꿀 수 없습니다.");
            notify(entry, "saving");
            const ack = await send(entry, record, keepalive);
            if (ack.ackRevision >= entry.ackRevision) {
              entry.ackRevision = ack.ackRevision;
              entry.lastEventSequence = ack.lastEventSequence;
              entry.ackOutcome = ack.panelOutcome;
              entry.receiptId = ack.receiptId;
              entry.ackFingerprint = ack.ackRevision === record.revision && ack.panelOutcome === record.panelOutcome ? fingerprint(record) : null;
            }
            if (entry.pending && covers(entry, entry.pending)) {
              if (entry.pending !== record && !confirmed(entry, entry.pending)) conflict(entry);
              entry.pending = null;
              clearTimeout(timers.get(sessionId));
              timers.delete(sessionId);
            }
            persist(entry, false, record);
            notify(entry, entry.pending ? "queued" : "saved");
          }
          return state(sessionId);
        })
        .catch((error) => {
          persist(entry, false);
          notify(entry, "error", error.message || "기록 저장에 실패했습니다. 다시 시도해 주세요.");
          throw error;
        })
        .finally(() => {
          pumps.delete(sessionId);
        });
      pumps.set(sessionId, pump);
      return pump;
    }

    async function flush(record, flushOptions = {}) {
      if (!record) return retryPending(flushOptions);
      enqueue(record);
      const target = JSON.parse(JSON.stringify(record));
      target.panelOutcome = target.panelOutcome || "in_progress";
      clearTimeout(timers.get(record.sessionId));
      timers.delete(record.sessionId);
      const entry = entries.get(record.sessionId);
      if (!covers(entry, target)) {
        try {
          await ensurePump(record.sessionId, flushOptions.keepalive);
        } catch (error) {
          if (!covers(entry, target)) throw error;
        }
      }
      if (!covers(entry, target)) throw new Error("요청한 체험 기록의 저장을 확인하지 못했습니다. 다시 시도해 주세요.");
      return state(record.sessionId);
    }

    function retryPending(flushOptions = {}) {
      restore(true);
      return Promise.all(
        [...entries.values()]
          .filter((entry) => entry.pending)
          .map((entry) => {
            clearTimeout(timers.get(entry.sessionId));
            timers.delete(entry.sessionId);
            return ensurePump(entry.sessionId, flushOptions.keepalive);
          })
      );
    }

    function clear(sessionId) {
      const entry = entries.get(sessionId);
      if (!entry) return;
      if (entry.pending || pumps.has(sessionId)) throw new Error("서버 저장이 끝나지 않은 기록은 지울 수 없습니다.");
      const text = storage.getItem(sessionKey(sessionId));
      if (text && readSaved(text)[0].pending) throw new Error("서버 저장이 끝나지 않은 기록은 지울 수 없습니다.");
      storage.removeItem(sessionKey(sessionId));
      entries.delete(sessionId);
      statuses.delete(sessionId);
      clearTimeout(timers.get(sessionId));
      timers.delete(sessionId);
    }

    return Object.freeze({ enqueue, flush, retryPending, state, clear });
  }

  root.MoaSessionSync = Object.freeze({ create });
})(typeof window === "undefined" ? globalThis : window);
