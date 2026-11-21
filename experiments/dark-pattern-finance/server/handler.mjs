import { validatePayload, ValidationError } from "./validation.mjs";

const MAX_BYTES = 512 * 1024;
const DEFAULT_ORIGINS = ["https://saeromlee.kr", "https://www.saeromlee.kr"];

function configuredOrigins(raw) {
  const candidates = raw
    ? raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : DEFAULT_ORIGINS;
  return new Set(
    candidates.map((value) => {
      const url = new URL(value);
      if (url.origin !== value || url.protocol !== "https:") throw new Error("Invalid MOA_ALLOWED_ORIGINS");
      return value;
    })
  );
}

export function originAllowed(origin, allowed, allowLocalhost = false) {
  if (!origin || origin === "null") return false;
  if (allowed.has(origin)) return true;
  if (!allowLocalhost) return false;
  try {
    const url = new URL(origin);
    return url.origin === origin && url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  } catch (_) {
    return false;
  }
}

async function readBoundedJson(request) {
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!["application/json", "text/plain"].includes(contentType)) throw new ValidationError("JSON 요청이 필요합니다.", 415);
  const announced = Number(request.headers.get("content-length"));
  if (Number.isFinite(announced) && announced > MAX_BYTES) throw new ValidationError("요청 크기가 너무 큽니다.", 413);
  if (!request.body) throw new ValidationError("빈 요청입니다.");
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) {
        await reader.cancel();
        throw new ValidationError("요청 크기가 너무 큽니다.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (_) {
    throw new ValidationError("올바른 JSON 요청이 필요합니다.");
  }
}

async function hashToken(token, cryptoProvider) {
  const bytes = await cryptoProvider.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function serverCredentials(env) {
  const raw = env.SUPABASE_SECRET_KEYS;
  if (raw !== undefined && raw !== null) {
    let keys;
    try {
      keys = JSON.parse(raw);
    } catch (_) {
      return null;
    }
    if (!keys || typeof keys !== "object" || Array.isArray(keys)) return null;
    if (Object.prototype.hasOwnProperty.call(keys, "default")) {
      const key = keys.default;
      if (typeof key !== "string" || !/^sb_secret_[A-Za-z0-9_-]+$/.test(key)) return null;
      return { apikey: key };
    }
  }
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof key !== "string" || !key || /\s/.test(key)) return null;
  // Opaque secret keys are not JWTs, including when supplied through a legacy variable.
  return key.startsWith("sb_secret_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}

export function createHandler({ env, fetcher = globalThis.fetch, cryptoProvider = globalThis.crypto }) {
  const origins = configuredOrigins(env.MOA_ALLOWED_ORIGINS);
  const studyId = env.MOA_STUDY_ID || "finance-decision-20261120";
  const forceTest = env.MOA_FORCE_TEST !== "false";
  const allowLocalhost = env.MOA_ALLOW_LOCALHOST_QA === "true";
  const credentials = serverCredentials(env);

  return async function handle(request) {
    const origin = request.headers.get("origin");
    const allowed = originAllowed(origin, origins, allowLocalhost);
    const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", Vary: "Origin" };
    if (allowed)
      Object.assign(headers, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Max-Age": "600",
      });
    const respond = (status, body) => new Response(JSON.stringify(body), { status, headers });
    if (request.method === "GET") return respond(200, { ok: true, service: "moafit-collector", version: 1 });
    if (!allowed) return respond(403, { ok: false, error: "origin_not_allowed" });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return respond(405, { ok: false, error: "method_not_allowed" });
    if (!env.SUPABASE_URL || !credentials) return respond(503, { ok: false, error: "collector_not_configured" });
    try {
      const record = validatePayload(await readBoundedJson(request), { studyId, forceTest });
      const tokenHash = await hashToken(record.writeToken, cryptoProvider);
      const payload = { ...record };
      delete payload.writeToken;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      let upstream;
      let result;
      try {
        upstream = await fetcher(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/moafit_ingest_session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...credentials,
          },
          body: JSON.stringify({ p_record: payload, p_token_hash: tokenHash }),
          signal: controller.signal,
        });
        result = await upstream.json().catch(() => ({}));
      } finally {
        clearTimeout(timeout);
      }
      if (!upstream.ok) {
        if (result.code === "42501") return respond(403, { ok: false, error: "session_write_denied" });
        if (result.code === "23514") return respond(409, { ok: false, error: "session_conflict" });
        if (["22023", "22P02", "23502"].includes(result.code)) return respond(400, { ok: false, error: "invalid_record" });
        return respond(503, { ok: false, error: "storage_unavailable" });
      }
      if (
        result.ok !== true ||
        typeof result.receiptId !== "string" ||
        !result.receiptId ||
        result.sessionId !== record.sessionId ||
        !Number.isInteger(result.ackRevision) ||
        !Number.isInteger(result.lastEventSequence) ||
        !["in_progress", "complete", "out"].includes(result.panelOutcome)
      )
        return respond(503, { ok: false, error: "storage_ack_invalid" });
      return respond(200, result);
    } catch (error) {
      if (error instanceof ValidationError) return respond(error.status || 400, { ok: false, error: "invalid_payload" });
      return respond(503, { ok: false, error: "storage_unavailable" });
    }
  };
}
