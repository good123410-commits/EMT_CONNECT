import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SAFETYDATA_BASE = "https://www.safetydata.go.kr";

const CACHE_TTL_MINUTES = Number(Deno.env.get("DISASTER_TICKER_CACHE_TTL_MINUTES") ?? "30");
const FETCH_TIMEOUT_MS = Number(Deno.env.get("DISASTER_TICKER_TIMEOUT_MS") ?? "30000");
const FETCH_MAX_RETRIES = Number(Deno.env.get("DISASTER_TICKER_FETCH_RETRIES") ?? "2");

type SourceCode = "weather" | "forest_fire" | "disaster_sms";

interface SourceConfig {
  sourceCode: SourceCode;
  endpoint: string;
  label: string;
  maxItems: number;
  envKeys: string[];
}

interface KeyInfo {
  value: string;
  envKey: string;
}

interface SyncSourceResult {
  sourceCode: SourceCode;
  label: string;
  status: "ok" | "skipped" | "error";
  messageCount?: number;
  envKey?: string;
  error?: string;
  samples?: string[];
}

const SOURCES: SourceConfig[] = [
  {
    sourceCode: "weather",
    endpoint: "/V2/api/DSSP-IF-00045",
    label: "기상특보",
    maxItems: 8,
    envKeys: ["SAFETYDATA_SERVICE_KEY_WEATHER", "SAFETYDATA_SERVICE_KEY"],
  },
  {
    sourceCode: "forest_fire",
    endpoint: "/V2/api/DSSP-IF-10346",
    label: "산불정보",
    maxItems: 6,
    envKeys: ["SAFETYDATA_SERVICE_KEY_FOREST", "SAFETYDATA_SERVICE_KEY"],
  },
  {
    sourceCode: "disaster_sms",
    endpoint: "/V2/api/DSSP-IF-00247",
    label: "긴급재난문자",
    maxItems: 10,
    envKeys: ["SAFETYDATA_SERVICE_KEY_DISASTER", "SAFETYDATA_SERVICE_KEY"],
  },
];

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(name: string): string {
  return Deno.env.get(name)?.trim() ?? "";
}

function getFallbackServiceKey(): string {
  return getEnv("SAFETYDATA_SERVICE_KEY");
}

function normalizeServiceKey(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function resolveServiceKey(source: SourceConfig): KeyInfo | null {
  for (const envKey of source.envKeys) {
    const value = normalizeServiceKey(getEnv(envKey));
    if (value) return { value, envKey };
  }

  const fallback = normalizeServiceKey(getFallbackServiceKey());
  if (fallback) {
    return { value: fallback, envKey: "SAFETYDATA_SERVICE_KEY (fallback)" };
  }

  return null;
}

function assertAnyServiceKeyConfigured(): void {
  const configured = SOURCES.map((source) => resolveServiceKey(source)).filter(Boolean);
  if (configured.length > 0) return;

  throw new Error(
    "재난안전 API 키가 없습니다. Edge Function Secrets에 SAFETYDATA_SERVICE_KEY_WEATHER / _FOREST / _DISASTER 를 등록하세요.",
  );
}

function authorizeRequest(req: Request): boolean {
  const cronSecret = getEnv("DISASTER_TICKER_CRON_SECRET");
  const cronHeader = req.headers.get("x-cron-secret");
  if (cronSecret && cronHeader === cronSecret) {
    return true;
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`) {
    return true;
  }

  const apiKey = req.headers.get("apikey") ?? "";
  if (serviceRoleKey && apiKey === serviceRoleKey) {
    return true;
  }

  return false;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (value && typeof value === "object") return [value as Record<string, unknown>];
  return [];
}

function pickString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  }
  return "";
}

function isJunkSyncedMessage(message: string): boolean {
  const text = message.replace(/\s+/g, " ").trim();
  if (!text || text.length < 8) return true;
  if (/^\d{4}[-./]\d{1,2}[-./]\d{1,2}(?:일)?$/.test(text)) return true;
  if (/^\d{8,14}$/.test(text)) return true;
  if (/^[\d\s·.,:/-]+$/.test(text)) return true;
  return false;
}

function extractMessagesFromRecord(record: Record<string, unknown>, sourceCode: SourceCode): string {
  if (sourceCode === "weather") {
    const message = pickString(record, [
      "WRN_MSG",
      "SPCL_WRN",
      "WRN",
      "WRN_KO",
      "T1",
      "T2",
      "TITLE",
      "SUBJECT",
      "MSG_CN",
      "CONTENT",
    ]);
    const region = pickString(record, ["STN_KO", "STN_NM", "AREA_NAME", "REG_KO", "REG_NAME"]);
    if (!message) return "";
    return [region, message].filter(Boolean).join(" · ");
  }

  if (sourceCode === "forest_fire") {
    const message = pickString(record, [
      "FRFR_STT_CN",
      "FRFR_INFO",
      "MSG_CN",
      "MSG",
      "CONTENT",
      "TITLE",
      "FRFR_STEP_NM",
      "STATUS",
    ]);
    const region = pickString(record, ["ADDR", "ADDR_NM", "AREA_NM", "SGG_NM", "FRFR_LCTN"]);
    if (!message && !region) return "";
    return [region, message].filter(Boolean).join(" · ");
  }

  if (sourceCode === "disaster_sms") {
    const message = pickString(record, [
      "MSG_CN",
      "MSG",
      "MSG_CONTENT",
      "EMRG_MSG",
      "DST_MSG",
      "CONTENT",
      "CN",
    ]);
    const region = pickString(record, ["RCPTN_RGN_NM", "DST_SE_NM", "AREA_NAME", "SGG_NM", "EMRG_AREA"]);
    if (!message) return "";
    return region ? `${region} · ${message}` : message;
  }

  return pickString(record, ["MSG_CN", "MSG", "CONTENT", "TITLE"]);
}

function normalizeBody(payload: Record<string, unknown>): Record<string, unknown>[] {
  if (Array.isArray(payload.body)) return payload.body as Record<string, unknown>[];
  if (Array.isArray(payload.data)) return payload.data as Record<string, unknown>[];
  if (Array.isArray(payload.items)) return payload.items as Record<string, unknown>[];
  if (Array.isArray(payload.list)) return payload.list as Record<string, unknown>[];

  const response = payload.response;
  if (response && typeof response === "object") {
    const body = (response as Record<string, unknown>).body;
    if (body && typeof body === "object") {
      const bodyRecord = body as Record<string, unknown>;
      return asArray(bodyRecord.items ?? bodyRecord.item ?? bodyRecord.data ?? bodyRecord.list ?? body);
    }
  }

  const body = payload.body;
  if (body && typeof body === "object") {
    const bodyRecord = body as Record<string, unknown>;
    return asArray(bodyRecord.items ?? bodyRecord.item ?? bodyRecord.data ?? bodyRecord.list ?? body);
  }

  return [];
}

function dedupeMessages(messages: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const message of messages) {
    const normalized = message.replace(/\s+/g, " ").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function formatApiError(header: Record<string, unknown> | undefined): string {
  const resultCode = String(header?.resultCode ?? header?.RESULT_CODE ?? "");
  const resultMsg = String(
    header?.resultMsg ?? header?.RESULT_MSG ?? header?.errorMsg ?? "unknown error",
  );

  if (resultCode === "32" || /UNREGISTERED IP/i.test(resultMsg)) {
    return `${resultCode}: ${resultMsg} — safetydata.go.kr 유치아이피에 Supabase Edge Function egress IP를 등록하세요.`;
  }

  if (resultCode === "30" || /NOT REGISTERED/i.test(resultMsg)) {
    return [
      `${resultCode}: ${resultMsg}`,
      "유치아이피 불일치 — Edge Function에서 나가는 공인 IP를 포털에 등록해야 합니다.",
    ].join(" | ");
  }

  return `${resultCode}: ${resultMsg}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSafetyDataPage(
  endpoint: string,
  serviceKey: string,
  pageNo: number,
  numOfRows: number,
): Promise<Record<string, unknown>[]> {
  const attempts = [
    { param: "serviceKey", key: serviceKey },
    { param: "ServiceKey", key: serviceKey },
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    const url = new URL(`${SAFETYDATA_BASE}${endpoint}`);
    url.searchParams.set(attempt.param, attempt.key);
    url.searchParams.set("returnType", "json");
    url.searchParams.set("pageNo", String(pageNo));
    url.searchParams.set("numOfRows", String(numOfRows));

    for (let retry = 0; retry <= FETCH_MAX_RETRIES; retry += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            Connection: "close",
            "User-Agent": "Mozilla/5.0 (compatible; KEMIX-DisasterTickerSync/2.0; +https://k-emix.com)",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as Record<string, unknown>;
        const header = (payload.header ?? (payload.response as Record<string, unknown> | undefined)?.header) as
          | Record<string, unknown>
          | undefined;
        const resultCode = String(header?.resultCode ?? header?.RESULT_CODE ?? "00");
        if (resultCode && resultCode !== "00" && resultCode !== "0") {
          throw new Error(`API ${formatApiError(header)}`);
        }

        return normalizeBody(payload);
      } catch (err) {
        lastError = err;
        if (retry < FETCH_MAX_RETRIES) {
          await wait(800 * (retry + 1));
        }
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`${message} (${SAFETYDATA_BASE}${endpoint})`);
}

async function fetchSourceMessages(source: SourceConfig): Promise<string[]> {
  const keyInfo = resolveServiceKey(source);
  if (!keyInfo) {
    throw new Error(`API 키 미설정 (${source.envKeys.join(" / ")})`);
  }

  const rows = await fetchSafetyDataPage(
    source.endpoint,
    keyInfo.value,
    1,
    Math.max(source.maxItems, 10),
  );

  return dedupeMessages(
    rows
      .map((row) => extractMessagesFromRecord(row, source.sourceCode))
      .filter((message) => message.length >= 8 && !isJunkSyncedMessage(message)),
  ).slice(0, source.maxItems);
}

async function upsertCache(
  supabase: SupabaseClient,
  sourceCode: SourceCode,
  messages: string[],
  lastError: string | null = null,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MINUTES * 60_000);

  const { error } = await supabase.from("kemix_disaster_ticker_cache").upsert(
    {
      source_code: sourceCode,
      messages,
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      last_error: lastError,
    },
    { onConflict: "source_code" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function handleSourceFailure(
  supabase: SupabaseClient,
  source: SourceConfig,
  message: string,
): Promise<void> {
  const { data } = await supabase
    .from("kemix_disaster_ticker_cache")
    .select("messages, expires_at")
    .eq("source_code", source.sourceCode)
    .maybeSingle();

  if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
    const staleExpires = new Date(Date.now() + 10 * 60_000).toISOString();
    await supabase
      .from("kemix_disaster_ticker_cache")
      .update({ last_error: message, expires_at: staleExpires })
      .eq("source_code", source.sourceCode);
    return;
  }

  await upsertCache(supabase, source.sourceCode, [], message);
}

async function runSync(dryRun: boolean): Promise<Record<string, unknown>> {
  assertAnyServiceKeyConfigured();

  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseServiceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!dryRun && (!supabaseUrl || !supabaseServiceRoleKey)) {
    throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 Edge Function 환경에 없습니다.");
  }

  const supabase = dryRun
    ? null
    : createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

  const results: SyncSourceResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const source of SOURCES) {
    const keyInfo = resolveServiceKey(source);
    if (!keyInfo) {
      results.push({
        sourceCode: source.sourceCode,
        label: source.label,
        status: "skipped",
        error: `API 키 없음 (${source.envKeys[0]})`,
      });
      failureCount += 1;
      continue;
    }

    try {
      const messages = await fetchSourceMessages(source);

      if (dryRun) {
        results.push({
          sourceCode: source.sourceCode,
          label: source.label,
          status: "ok",
          messageCount: messages.length,
          envKey: keyInfo.envKey,
          samples: messages.slice(0, 3),
        });
        successCount += 1;
        continue;
      }

      await upsertCache(supabase!, source.sourceCode, messages, null);
      results.push({
        sourceCode: source.sourceCode,
        label: source.label,
        status: "ok",
        messageCount: messages.length,
        envKey: keyInfo.envKey,
      });
      successCount += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failureCount += 1;
      results.push({
        sourceCode: source.sourceCode,
        label: source.label,
        status: "error",
        envKey: keyInfo.envKey,
        error: message,
      });

      if (!dryRun && supabase) {
        await handleSourceFailure(supabase, source, message);
      }
    }
  }

  return {
    dryRun,
    successCount,
    failureCount,
    results,
    completedAt: new Date().toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!authorizeRequest(req)) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const url = new URL(req.url);
    const dryRun =
      url.searchParams.get("dry_run") === "true" ||
      url.searchParams.get("dry-run") === "true";

    const payload = await runSync(dryRun);
    const status = payload.successCount === 0 ? 502 : 200;
    return json(payload, status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
});
