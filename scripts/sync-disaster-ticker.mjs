/**
 * 재난안전데이터 공유플랫폼 API → Supabase 캐시 동기화
 *
 * - 기상청 특보통보문 (DSSP-IF-00045)
 * - 산불정보 (DSSP-IF-10346)
 * - 행정안전부 긴급재난문자 (DSSP-IF-00247)
 *
 * 환경 변수 (소스별 키 권장):
 *   SAFETYDATA_SERVICE_KEY_WEATHER
 *   SAFETYDATA_SERVICE_KEY_FOREST
 *   SAFETYDATA_SERVICE_KEY_DISASTER
 *   (또는 공통 SAFETYDATA_SERVICE_KEY)
 *
 * 로컬 실행 (권장 — safetydata 유치아이피 등록 PC, 예: 1.214.117.34):
 *   npm run sync:disaster-ticker:check
 *   npm run sync:disaster-ticker:dry-run
 *   npm run sync:disaster-ticker
 *   .\scripts\register-disaster-ticker-task.ps1
 *
 * Edge Function (선택): supabase/functions/sync-disaster-ticker
 *   scripts/deploy-sync-disaster-ticker.ps1
 */
import { createClient } from '@supabase/supabase-js';
import { Agent } from 'undici';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SAFETYDATA_BASE = 'https://www.safetydata.go.kr';

const SOURCES = [
  {
    sourceCode: 'weather',
    endpoint: '/V2/api/DSSP-IF-00045',
    label: '기상특보',
    maxItems: 8,
    envKeys: ['SAFETYDATA_SERVICE_KEY_WEATHER', 'SAFETYDATA_SERVICE_KEY'],
  },
  {
    sourceCode: 'forest_fire',
    endpoint: '/V2/api/DSSP-IF-10346',
    label: '산불정보',
    maxItems: 6,
    envKeys: ['SAFETYDATA_SERVICE_KEY_FOREST', 'SAFETYDATA_SERVICE_KEY'],
  },
  {
    sourceCode: 'disaster_sms',
    endpoint: '/V2/api/DSSP-IF-00247',
    label: '긴급재난문자',
    maxItems: 10,
    envKeys: ['SAFETYDATA_SERVICE_KEY_DISASTER', 'SAFETYDATA_SERVICE_KEY'],
  },
];

const CACHE_TTL_MINUTES = Number(process.env.DISASTER_TICKER_CACHE_TTL_MINUTES ?? 30);
const FETCH_TIMEOUT_MS = Number(process.env.DISASTER_TICKER_TIMEOUT_MS ?? 30_000);
const FETCH_CONNECT_TIMEOUT_MS = Number(process.env.DISASTER_TICKER_CONNECT_TIMEOUT_MS ?? 30_000);
const FETCH_MAX_RETRIES = Number(process.env.DISASTER_TICKER_FETCH_RETRIES ?? 2);
const DRY_RUN = process.argv.includes('--dry-run');
const CHECK_ONLY = process.argv.includes('--check');
const CI_ENV_FILE = '.env.disaster-ticker.ci';
const SAFETYDATA_STRICT_TLS =
  process.env.SAFETYDATA_STRICT_TLS === '1' || process.env.SAFETYDATA_STRICT_TLS === 'true';

const safetydataHttpDispatcher = new Agent({
  connect: {
    rejectUnauthorized: SAFETYDATA_STRICT_TLS,
    timeout: FETCH_CONNECT_TIMEOUT_MS,
    servername: 'www.safetydata.go.kr',
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.2',
  },
  bodyTimeout: FETCH_TIMEOUT_MS,
  headersTimeout: FETCH_CONNECT_TIMEOUT_MS,
  keepAliveTimeout: 10_000,
  keepAliveMaxTimeout: 30_000,
});

async function safetydataFetch(url, init = {}) {
  return fetch(url, {
    ...init,
    dispatcher: safetydataHttpDispatcher,
  });
}

function getSupabaseUrl() {
  return process.env.SUPABASE_URL?.trim() ?? '';
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
}

function getFallbackServiceKey() {
  return (
    process.env.SAFETYDATA_SERVICE_KEY?.trim() ||
    process.env.EXPO_PUBLIC_SAFETYDATA_SERVICE_KEY?.trim() ||
    process.env.EXPO_PUBLIC_PORTAL_API_KEY?.trim() ||
    ''
  );
}

function parseEnvLine(line) {
  let trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  if (trimmed.startsWith('export ')) {
    trimmed = trimmed.slice('export '.length).trim();
  }

  const eq = trimmed.indexOf('=');
  if (eq <= 0) return null;
  const key = trimmed.slice(0, eq).trim().replace(/^\uFEFF/, '');
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  value = value.replace(/^\uFEFF/, '').replace(/\r$/, '').trim();
  const hash = value.indexOf(' #');
  if (hash > 0) {
    value = value.slice(0, hash).trim();
  }
  if (!key || !value) return null;
  return { key, value };
}

function applyEnvEntry(key, value, force = false) {
  if (!key || !value) return false;
  const existing = process.env[key]?.trim();
  if (!force && existing) return false;
  process.env[key] = value;
  return true;
}

function loadEnvFile(filename, { force = false } = {}) {
  const filePath = join(ROOT, filename);
  if (!existsSync(filePath)) return 0;

  let applied = 0;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed && applyEnvEntry(parsed.key, parsed.value, force)) {
      applied += 1;
    }
  }
  return applied;
}

function loadBundledEnv(raw, { force = false } = {}) {
  if (!raw?.trim()) return 0;
  let applied = 0;
  for (const line of raw.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed && applyEnvEntry(parsed.key, parsed.value, force)) {
      applied += 1;
    }
  }
  return applied;
}

function bootstrapEnv() {
  const bundledApplied = loadBundledEnv(process.env.DISASTER_TICKER_DOTENV, { force: true });
  const ciApplied = loadEnvFile(CI_ENV_FILE, { force: true });
  const localApplied = loadEnvFile('.env.local') + loadEnvFile('.env');

  if (bundledApplied > 0) {
    log(`Loaded ${bundledApplied} keys from DISASTER_TICKER_DOTENV`);
  }
  if (ciApplied > 0) {
    log(`Loaded ${ciApplied} keys from ${CI_ENV_FILE}`);
  }
  if (localApplied > 0) {
    log(`Loaded ${localApplied} keys from local env files`);
  }
}

function log(...args) {
  console.log('[sync-disaster-ticker]', ...args);
}

function isPrivateIp(ip) {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === '::1') return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  return false;
}

async function resolveOutboundPublicIp() {
  const endpoints = [
    'https://api.ipify.org?format=json',
    'https://ifconfig.me/ip',
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (typeof json.ip === 'string' && json.ip.trim()) {
          return json.ip.trim();
        }
      }
      const text = (await response.text()).trim();
      if (text) return text.split('\n')[0].trim();
    } catch {
      // try next endpoint
    }
  }

  return null;
}

function getRegisteredIpHint() {
  return process.env.SAFETYDATA_REGISTERED_IP?.trim() || null;
}

function isIpWhitelistApiError(message) {
  return /SERVICE KEY IS NOT REGISTERED|NOT REGISTERED|UNREGISTERED IP|오류.?30|resultCode.?30/i.test(
    message,
  );
}

function ipWhitelistHint() {
  const registered = getRegisteredIpHint();
  return [
    'safetydata.go.kr API키의 "유치아이피"가 요청 출발 IP와 다르면 오류 30이 납니다.',
    registered
      ? `포털 등록 유치아이피: ${registered} (이 값을 바꿀 필요 없음 — 요청 IP가 같아야 함)`
      : '포털 → 마이페이지 → 데이터 이용 내역 → 유치아이피를 이 PC/서버 공인 IP로 등록',
    '사설 IP(192.168.x.x)로 등록하면 외부 API 호출이 거절됩니다.',
    'GitHub 공용 러너(ubuntu-latest)는 IP가 매 실행마다 달라집니다 → self-hosted runner 또는 로컬 스케줄 사용',
  ]
    .filter(Boolean)
    .join('\n     ');
}

function logOutboundIpGuidance(outboundIp) {
  const registered = getRegisteredIpHint();
  if (!outboundIp) {
    log('공인 IP 자동 조회 실패 — 브라우저에서 "내 아이피" 검색 후 포털 유치아이피와 비교하세요.');
    return;
  }

  log(`현재 API 요청 공인 IP: ${outboundIp}`);
  if (registered) {
    log(`포털 등록 유치아이피: ${registered}`);
    if (outboundIp === registered) {
      log('  → IP 일치. 오류 30이면 키 승인·변경 반영 대기(10~30분)를 확인하세요.');
    } else {
      log(`  → IP 불일치. 포털 유치아이피를 ${outboundIp}(현재 요청 IP)로 변경신청하세요.`);
      log('     또는 등록 IP에서 나가는 네트워크/PC에서만 이 스크립트를 실행하세요.');
    }
  } else {
    log('  → safetydata 포털 "유치아이피"와 동일해야 합니다. (SAFETYDATA_REGISTERED_IP 로 등록값 기록 가능)');
  }
}

function logIpWhitelistResolution(outboundIp, ipWhitelistFailureCount, failureCount) {
  if (ipWhitelistFailureCount === 0 || ipWhitelistFailureCount !== failureCount) {
    return;
  }

  const registered = getRegisteredIpHint() ?? '(포털 등록값)';
  log('');
  log('=== 유치아이피 불일치 (오류 30) ===');
  log(`요청 IP: ${outboundIp ?? '알 수 없음'} / 포털 등록: ${registered}`);
  if (outboundIp && registered !== '(포털 등록값)' && outboundIp !== registered) {
    log(`포털 유치아이피를 ${outboundIp} 로 변경신청하거나,`);
    log(`${registered} 에서 나가는 PC/서버에서만 동기화를 실행하세요.`);
  } else if (outboundIp) {
    log(`포털 유치아이피를 ${outboundIp} 로 등록(변경신청)하세요.`);
  } else {
    log('포털 유치아이피를 이 PC의 공인 IP로 등록하세요.');
  }

  if (process.env.GITHUB_ACTIONS === 'true') {
    log('');
    log('GitHub 공용 러너에서는 매번 다른 IP로 요청되어 API 30이 납니다.');
    log('해결 1) 이 PC(유치아이피 등록 PC)에 self-hosted runner 설치 → 워크플로우가 여기서 실행');
    log('해결 2) scripts/register-disaster-ticker-task.ps1 로 로컬 30분 스케줄 등록');
    log('       (GitHub Actions schedule은 self-hosted 없이는 동작하지 않습니다)');
  } else {
    log('');
    log('이 PC에서 npm run sync:disaster-ticker 를 실행하거나,');
    log('고정 공인 IP 서버에서 스크립트를 돌리세요.');
  }
}

function maskKey(key) {
  if (!key) return '(없음)';
  if (key.length <= 4) return `(길이 ${key.length})`;
  return `${key.slice(0, 2)}...${key.slice(-2)} (길이 ${key.length})`;
}

function normalizeServiceKey(raw) {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) return '';
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function resolveServiceKey(source) {
  for (const envKey of source.envKeys) {
    const value = normalizeServiceKey(process.env[envKey]);
    if (value) return { value, envKey };
  }
  if (getFallbackServiceKey()) {
    return {
      value: normalizeServiceKey(getFallbackServiceKey()),
      envKey: 'SAFETYDATA_SERVICE_KEY (fallback)',
    };
  }
  return null;
}

function assertAnyServiceKeyConfigured() {
  bootstrapEnv();

  const configured = SOURCES.map((source) => resolveServiceKey(source)).filter(Boolean);
  if (configured.length > 0) return;

  log('환경 변수 진단:');
  for (const key of [
    'SAFETYDATA_SERVICE_KEY_WEATHER',
    'SAFETYDATA_SERVICE_KEY_FOREST',
    'SAFETYDATA_SERVICE_KEY_DISASTER',
    'SAFETYDATA_SERVICE_KEY',
    'EXPO_PUBLIC_SAFETYDATA_SERVICE_KEY',
  ]) {
    log(`  ${key}: ${maskKey(process.env[key])}`);
  }
  log(`  DISASTER_TICKER_DOTENV: ${process.env.DISASTER_TICKER_DOTENV?.trim() ? '(설정됨)' : '(없음)'}`);
  log(`  .env.disaster-ticker.ci: ${existsSync(join(ROOT, CI_ENV_FILE)) ? '(존재)' : '(없음)'}`);
  log(`  GITHUB_ACTIONS: ${process.env.GITHUB_ACTIONS ?? 'false'}`);

  const ciHints =
    process.env.GITHUB_ACTIONS === 'true'
      ? [
          '',
          'GitHub Actions 설정:',
          '  Repository → Settings → Secrets and variables → Actions',
          '  아래 중 한 가지 방식으로 등록하세요.',
          '',
          '  [권장] DISASTER_TICKER_DOTENV — .env 형식 전체를 한 번에 붙여넣기',
          '    SAFETYDATA_SERVICE_KEY_WEATHER=...',
          '    SAFETYDATA_SERVICE_KEY_FOREST=...',
          '    SAFETYDATA_SERVICE_KEY_DISASTER=...',
          '    SUPABASE_URL=https://....supabase.co',
          '    SUPABASE_SERVICE_ROLE_KEY=sb_secret_...',
          '',
          '  [또는] 개별 Secret 등록:',
          '    SAFETYDATA_SERVICE_KEY_WEATHER / _FOREST / _DISASTER',
          '    (또는 공통 SAFETYDATA_SERVICE_KEY)',
          '    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY',
        ]
      : [];

  throw new Error(
    [
      '재난안전 API 키가 없습니다.',
      '다음 중 하나 이상을 .env 또는 환경 변수로 설정하세요:',
      '  SAFETYDATA_SERVICE_KEY_WEATHER',
      '  SAFETYDATA_SERVICE_KEY_FOREST',
      '  SAFETYDATA_SERVICE_KEY_DISASTER',
      '  (또는 공통 SAFETYDATA_SERVICE_KEY)',
      '',
      'Windows PowerShell 예시:',
      '  $env:SAFETYDATA_SERVICE_KEY_WEATHER="키값"',
      '  $env:SUPABASE_URL="https://....supabase.co"',
      '  $env:SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."',
      '  npm run sync:disaster-ticker',
      '',
      '주의: CMD/PowerShell에서는 VAR=value npm run 형식이 동작하지 않습니다.',
      ...ciHints,
    ].join('\n'),
  );
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  return [];
}

function pickString(record, keys) {
  if (!record || typeof record !== 'object') return '';
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  }
  return '';
}

function isJunkSyncedMessage(message) {
  const text = message.replace(/\s+/g, ' ').trim();
  if (!text || text.length < 8) return true;
  if (/^\d{4}[-./]\d{1,2}[-./]\d{1,2}(?:일)?$/.test(text)) return true;
  if (/^\d{8,14}$/.test(text)) return true;
  if (/^[\d\s·.,:/-]+$/.test(text)) return true;
  return false;
}

function extractMessagesFromRecord(record, sourceCode) {
  if (sourceCode === 'weather') {
    const message = pickString(record, [
      'WRN_MSG',
      'SPCL_WRN',
      'WRN',
      'WRN_KO',
      'T1',
      'T2',
      'TITLE',
      'SUBJECT',
      'MSG_CN',
      'CONTENT',
    ]);
    const region = pickString(record, ['STN_KO', 'STN_NM', 'AREA_NAME', 'REG_KO', 'REG_NAME']);
    if (!message) return '';
    return [region, message].filter(Boolean).join(' · ');
  }

  if (sourceCode === 'forest_fire') {
    const message = pickString(record, [
      'FRFR_STT_CN',
      'FRFR_INFO',
      'MSG_CN',
      'MSG',
      'CONTENT',
      'TITLE',
      'FRFR_STEP_NM',
      'STATUS',
    ]);
    const region = pickString(record, ['ADDR', 'ADDR_NM', 'AREA_NM', 'SGG_NM', 'FRFR_LCTN']);
    if (!message && !region) return '';
    return [region, message].filter(Boolean).join(' · ');
  }

  if (sourceCode === 'disaster_sms') {
    const message = pickString(record, [
      'MSG_CN',
      'MSG',
      'MSG_CONTENT',
      'EMRG_MSG',
      'DST_MSG',
      'CONTENT',
      'CN',
    ]);
    const region = pickString(record, ['RCPTN_RGN_NM', 'DST_SE_NM', 'AREA_NAME', 'SGG_NM', 'EMRG_AREA']);
    if (!message) return '';
    return region ? `${region} · ${message}` : message;
  }

  return pickString(record, ['MSG_CN', 'MSG', 'CONTENT', 'TITLE']);
}

function normalizeBody(payload) {
  if (!payload || typeof payload !== 'object') return [];

  if (Array.isArray(payload.body)) return payload.body;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.list)) return payload.list;

  const response = payload.response;
  if (response && typeof response === 'object') {
    const body = response.body;
    if (body && typeof body === 'object') {
      return asArray(body.items ?? body.item ?? body.data ?? body.list ?? body);
    }
  }

  const body = payload.body;
  if (body && typeof body === 'object') {
    return asArray(body.items ?? body.item ?? body.data ?? body.list ?? body);
  }

  return [];
}

function dedupeMessages(messages) {
  const seen = new Set();
  const result = [];
  for (const message of messages) {
    const normalized = message.replace(/\s+/g, ' ').trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function describeFetchError(err, url) {
  const parts = [];
  if (err instanceof Error) {
    parts.push(err.message);
    if (err.cause instanceof Error) {
      parts.push(`cause: ${err.cause.message}`);
      if (err.cause.code) parts.push(`code: ${err.cause.code}`);
    } else if (err.cause && typeof err.cause === 'object' && 'code' in err.cause) {
      parts.push(`code: ${String(err.cause.code)}`);
    }
  } else {
    parts.push(String(err));
  }

  const text = parts.join(' | ');
  const hints = [];
  if (/certificate|UNABLE_TO_VERIFY|SSL|TLS|fetch failed|ECONNRESET|ETIMEDOUT|abort/i.test(text)) {
    hints.push('safetydata.go.kr TLS/네트워크 오류 — GitHub Actions에서는 SAFETYDATA_STRICT_TLS=false(기본) 사용');
    hints.push('포털 유치아이피에 GitHub Actions 러너 공인 IP 등록 필요');
  }
  if (url) {
    hints.push(`url: ${url.origin}${url.pathname}`);
  }

  return hints.length > 0 ? `${text}\n     ${hints.join('\n     ')}` : text;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatApiError(header) {
  const resultCode = String(header?.resultCode ?? header?.RESULT_CODE ?? '');
  const resultMsg = header?.resultMsg ?? header?.RESULT_MSG ?? header?.errorMsg ?? 'unknown error';

  if (resultCode === '32' || /UNREGISTERED IP/i.test(String(resultMsg))) {
    return `${resultCode}: ${resultMsg} — safetydata.go.kr API 신청 화면에서 현재 PC/GitHub Actions IP를 등록하세요.`;
  }

  if (resultCode === '30' || /NOT REGISTERED/i.test(String(resultMsg))) {
    return [
      `${resultCode}: ${resultMsg}`,
      '→ 키·승인은 정상이어도 "유치아이피" 불일치 시 이 오류가 납니다',
      ipWhitelistHint(),
      '→ 포털 미리보기는 내부 서버에서 테스트되어 로컬 스크립트와 결과가 다를 수 있음',
    ].join('\n     ');
  }

  return `${resultCode}: ${resultMsg}`;
}

async function fetchSafetyDataPage(endpoint, serviceKey, pageNo, numOfRows) {
  const attempts = [
    { param: 'serviceKey', key: serviceKey },
    { param: 'ServiceKey', key: serviceKey },
  ];

  let lastError = null;

  for (const attempt of attempts) {
    const url = new URL(`${SAFETYDATA_BASE}${endpoint}`);
    url.searchParams.set(attempt.param, attempt.key);
    url.searchParams.set('returnType', 'json');
    url.searchParams.set('pageNo', String(pageNo));
    url.searchParams.set('numOfRows', String(numOfRows));

    for (let retry = 0; retry <= FETCH_MAX_RETRIES; retry += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const response = await safetydataFetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            Connection: 'close',
            'User-Agent':
              'Mozilla/5.0 (compatible; KEMIX-DisasterTickerSync/1.1; +https://k-emix.com)',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const header = payload.header ?? payload.response?.header;
        const resultCode = String(header?.resultCode ?? header?.RESULT_CODE ?? '00');
        if (resultCode && resultCode !== '00' && resultCode !== '0') {
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

  throw new Error(describeFetchError(lastError, new URL(`${SAFETYDATA_BASE}${endpoint}`)));
}

async function fetchSourceMessages(source) {
  const keyInfo = resolveServiceKey(source);
  if (!keyInfo) {
    throw new Error(`API 키 미설정 (${source.envKeys.join(' / ')})`);
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

async function upsertCache(supabase, sourceCode, messages, lastError = null) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MINUTES * 60_000);

  const { error } = await supabase.from('kemix_disaster_ticker_cache').upsert(
    {
      source_code: sourceCode,
      messages,
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      last_error: lastError,
    },
    { onConflict: 'source_code' },
  );

  if (error) {
    if (/kemix_disaster_ticker_cache/i.test(error.message)) {
      throw new Error(
        `${error.message} — supabase/migration_v72_emergency_ticker.sql 마이그레이션을 먼저 적용하세요.`,
      );
    }
    throw new Error(error.message);
  }
}

async function runKeyCheck() {
  log('=== 재난안전 API 키 진단 (--check) ===');
  const publicIp = await resolveOutboundPublicIp();
  logOutboundIpGuidance(publicIp);
  log('');

  let okCount = 0;

  for (const source of SOURCES) {
    const keyInfo = resolveServiceKey(source);
    log(`[${source.label}] ${source.endpoint}`);
    log(`  환경변수: ${keyInfo?.envKey ?? '미설정'}`);
    log(`  키 요약: ${maskKey(keyInfo?.value)}`);

    if (!keyInfo) {
      log('  결과: SKIP (키 없음)\n');
      continue;
    }

    try {
      const rows = await fetchSafetyDataPage(
        source.endpoint,
        keyInfo.value,
        1,
        3,
      );
      log(`  결과: OK (샘플 ${rows.length}건 수신)\n`);
      okCount += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log(`  결과: FAIL`);
      for (const line of message.split('\n     ')) {
        log(`    ${line}`);
      }
      log('');
    }
  }

  log(`진단 완료: ${okCount}/${SOURCES.length} 소스 인증 성공`);
  if (okCount === 0) {
    log('');
    log('체크리스트:');
    log('  1) 마이페이지 → 데이터 이용 내역 → API키 "유치아이피" 확인');
    log(`  2) 유치아이피를 공인 IP(${publicIp ?? '내 아이피 검색'})로 변경신청`);
    log('  3) 사설 IP(192.168.x.x)는 외부 API 호출 인증에 사용할 수 없습니다');
    log('  4) 변경 후 10~30분 뒤 npm run sync:disaster-ticker 재실행');
  }

  process.exitCode = okCount > 0 ? 0 : 1;
}

async function main() {
  bootstrapEnv();

  if (CHECK_ONLY) {
    assertAnyServiceKeyConfigured();
    await runKeyCheck();
    return;
  }

  assertAnyServiceKeyConfigured();

  const outboundIp = await resolveOutboundPublicIp();
  logOutboundIpGuidance(outboundIp);
  log('');

  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceRoleKey = getSupabaseServiceRoleKey();

  if (!DRY_RUN && (!supabaseUrl || !supabaseServiceRoleKey)) {
    throw new Error(
      'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다. (.env 파일 또는 PowerShell $env: 설정)',
    );
  }

  const supabase =
    DRY_RUN || !supabaseUrl || !supabaseServiceRoleKey
      ? null
      : createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

  let successCount = 0;
  let failureCount = 0;
  let ipWhitelistFailureCount = 0;

  for (const source of SOURCES) {
    const keyInfo = resolveServiceKey(source);
    if (!keyInfo) {
      log(`${source.label} 건너뜀: API 키 없음 (${source.envKeys[0]})`);
      failureCount += 1;
      continue;
    }

    try {
      const messages = await fetchSourceMessages(source);
      log(`${source.label}: ${messages.length}건 (${keyInfo.envKey})`);

      if (DRY_RUN) {
        for (const message of messages.slice(0, 3)) {
          log(`  - ${message}`);
        }
        successCount += 1;
        continue;
      }

      await upsertCache(supabase, source.sourceCode, messages, null);
      successCount += 1;
    } catch (err) {
      failureCount += 1;
      const message = err instanceof Error ? err.message : String(err);
      if (isIpWhitelistApiError(message)) {
        ipWhitelistFailureCount += 1;
      }
      log(`${source.label} 실패:`);
      for (const line of message.split('\n     ')) {
        log(`  ${line}`);
      }

      if (!DRY_RUN && supabase) {
        const { data } = await supabase
          .from('kemix_disaster_ticker_cache')
          .select('messages, expires_at')
          .eq('source_code', source.sourceCode)
          .maybeSingle();

        if (data?.messages?.length) {
          const staleExpires = new Date(Date.now() + 10 * 60_000).toISOString();
          await supabase
            .from('kemix_disaster_ticker_cache')
            .update({ last_error: message, expires_at: staleExpires })
            .eq('source_code', source.sourceCode);
          log(`${source.label}: 기존 캐시 유지 (만료 연장 10분)`);
        } else {
          await upsertCache(supabase, source.sourceCode, [], message);
        }
      }
    }
  }

  log(`완료 (성공 ${successCount}, 실패/건너뜀 ${failureCount})`);

  if (successCount === 0) {
    logIpWhitelistResolution(outboundIp, ipWhitelistFailureCount, failureCount);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('[sync-disaster-ticker] fatal:', err.message ?? err);
  process.exitCode = 1;
});
