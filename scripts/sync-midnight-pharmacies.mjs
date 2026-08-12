/**
 * E-Gen 심야약국 CSV 자동 다운로드 → Supabase upsert
 *
 * 다운로드 소스: https://www.e-gen.or.kr/egen/pharmacyList_list_csv.do
 * (E-Gen 약국찾기 페이지의「심야운영약국 목록 다운로드 csv」버튼과 동일)
 *
 * 로컬 실행:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run sync:pharmacies
 *
 * GitHub Actions: .github/workflows/sync-pharmacies.yml
 */
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

/** E-Gen 심야운영약국 CSV (search_pharmacy_general.js → csvDownload) */
const EGEN_CSV_URL =
  process.env.EGEN_MIDNIGHT_CSV_URL?.trim() ||
  'https://www.e-gen.or.kr/egen/pharmacyList_list_csv.do';

const EGEN_REFERER =
  process.env.EGEN_REFERER_URL?.trim() ||
  'https://www.e-gen.or.kr/egen/search_pharmacy.do?searchType=general';

const LOCAL_FALLBACK_PATH =
  process.env.MIDNIGHT_PHARMACY_CSV_PATH?.trim() ||
  join(ROOT, 'assets', 'data', 'midnight_pharmacy.csv');

const UPSERT_BATCH_SIZE = 200;
const DOWNLOAD_TIMEOUT_MS = 60_000;
const DOWNLOAD_MAX_RETRIES = 3;
const MIN_EXPECTED_ROWS = 50;

const ALLOW_LOCAL_FALLBACK =
  process.env.ALLOW_LOCAL_CSV_FALLBACK === '1' ||
  process.env.ALLOW_LOCAL_CSV_FALLBACK === 'true';


const CHROME_USER_AGENT =
  process.env.EGEN_USER_AGENT?.trim() ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const DRY_RUN = process.argv.includes('--dry-run');

function buildBrowserDownloadHeaders(cookie = '') {
  const headers = {
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    Pragma: 'no-cache',
    Referer: EGEN_REFERER,
    'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': CHROME_USER_AGENT,
  };

  if (cookie) {
    headers.Cookie = cookie;
  }

  return headers;
}

function extractSetCookieHeader(response) {
  if (typeof response.headers.getSetCookie === 'function') {
    return response.headers
      .getSetCookie()
      .map((entry) => entry.split(';')[0]?.trim())
      .filter(Boolean)
      .join('; ');
  }

  const raw = response.headers.get('set-cookie');
  if (!raw) return '';
  return raw
    .split(/,(?=\s*[^;,]+=)/)
    .map((entry) => entry.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

async function warmupEgenSession() {
  logInfo(`E-Gen 세션 워밍업: ${EGEN_REFERER}`);

  const response = await fetch(EGEN_REFERER, {
    method: 'GET',
    headers: buildBrowserDownloadHeaders(),
    redirect: 'follow',
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });

  const cookie = extractSetCookieHeader(response);
  if (!response.ok) {
    logInfo(`워밍업 HTTP ${response.status} — 쿠키 없이 CSV 다운로드 시도`);
    return '';
  }

  if (cookie) {
    logInfo('E-Gen 세션 쿠키 확보');
  }

  return cookie;
}

function formatFetchError(error) {
  if (!(error instanceof Error)) return String(error);
  const parts = [error.message];
  if (error.cause instanceof Error) {
    parts.push(`cause: ${error.cause.message}`);
  }
  return parts.join(' | ');
}

function logInfo(message) {
  console.log(`[sync-pharmacies] ${message}`);
}

function logError(message, detail) {
  console.error(`[sync-pharmacies] ERROR: ${message}`);
  if (detail) {
    console.error(
      typeof detail === 'string' ? detail : detail instanceof Error ? detail.stack ?? detail.message : detail,
    );
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePhone(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      quoted = !quoted;
      continue;
    }
    if (c === ',' && !quoted) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

function decodeCsvBuffer(buffer) {
  try {
    return new TextDecoder('euc-kr').decode(buffer);
  } catch {
    return buffer.toString('utf8');
  }
}

function parseMidnightPharmacyCsv(csvText, sourceLabel) {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 3) {
    throw new Error(`${sourceLabel}: CSV 행 수가 너무 적습니다 (${lines.length}행)`);
  }

  const headerLine = lines.find((line) => line.includes('약국명') && line.includes('대표전화'));
  if (!headerLine) {
    throw new Error(`${sourceLabel}: CSV 헤더(약국명,대표전화,…)를 찾을 수 없습니다`);
  }

  const headerIndex = lines.indexOf(headerLine);
  const dataLines = lines.slice(headerIndex + 1);
  const rows = [];

  for (const line of dataLines) {
    const cols = parseCsvLine(line);
    const name = String(cols[0] ?? '').trim();
    const phone = normalizePhone(cols[1]);
    const roadAddress = String(cols[2] ?? '').trim();
    const lotAddress = String(cols[3] ?? '').trim();
    const weeklyHours = cols.slice(4, 12).map((value) => String(value ?? '').trim());

    if (!phone || !name) continue;
    if (!weeklyHours.some(Boolean)) continue;

    rows.push({
      phone_normalized: phone,
      name,
      road_address: roadAddress || null,
      lot_address: lotAddress || null,
      weekly_hours: weeklyHours,
      source: sourceLabel,
      synced_at: new Date().toISOString(),
    });
  }

  if (rows.length < MIN_EXPECTED_ROWS) {
    throw new Error(
      `${sourceLabel}: 파싱된 약국 수가 비정상적으로 적습니다 (${rows.length}건, 최소 ${MIN_EXPECTED_ROWS}건 필요)`,
    );
  }

  return rows;
}

async function downloadEgenMidnightCsv() {
  let lastError = null;
  let sessionCookie = '';

  try {
    sessionCookie = await warmupEgenSession();
  } catch (warmupError) {
    logError('E-Gen 세션 워밍업 실패 — 쿠키 없이 CSV 다운로드 시도', warmupError);
  }

  for (let attempt = 1; attempt <= DOWNLOAD_MAX_RETRIES; attempt += 1) {
    try {
      logInfo(`E-Gen CSV 다운로드 시도 ${attempt}/${DOWNLOAD_MAX_RETRIES}: ${EGEN_CSV_URL}`);

      const response = await fetch(EGEN_CSV_URL, {
        method: 'GET',
        headers: buildBrowserDownloadHeaders(sessionCookie),
        redirect: 'follow',
        signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 1024) {
        throw new Error(`응답 크기가 너무 작습니다 (${buffer.length} bytes)`);
      }

      const csvText = decodeCsvBuffer(buffer);
      const rows = parseMidnightPharmacyCsv(csvText, 'egen_remote');

      const extractedAt = csvText.split(/\r?\n/)[0]?.trim() ?? '';
      logInfo(`다운로드 성공: ${buffer.length} bytes, ${rows.length}건 파싱`);
      if (extractedAt) {
        logInfo(`E-Gen 추출 시각: ${extractedAt}`);
      }

      return rows;
    } catch (error) {
      lastError = error;
      logError(`다운로드 실패 (시도 ${attempt}): ${formatFetchError(error)}`, error);
      if (attempt < DOWNLOAD_MAX_RETRIES) {
        await sleep(1500 * attempt);
        try {
          sessionCookie = await warmupEgenSession();
        } catch {
          // 재시도 시 워밍업 실패해도 다음 fetch는 진행
        }
      }
    }
  }

  throw new Error(
    `E-Gen CSV 다운로드 최종 실패 (${DOWNLOAD_MAX_RETRIES}회): ${formatFetchError(lastError)}`,
  );
}

function loadLocalFallbackCsv() {
  if (!existsSync(LOCAL_FALLBACK_PATH)) {
    throw new Error(`로컬 폴백 CSV 없음: ${LOCAL_FALLBACK_PATH}`);
  }

  logInfo(`로컬 폴백 CSV 사용: ${LOCAL_FALLBACK_PATH}`);
  const buffer = readFileSync(LOCAL_FALLBACK_PATH);
  const csvText = decodeCsvBuffer(buffer);
  return parseMidnightPharmacyCsv(csvText, 'egen_csv_fallback');
}

async function acquireMidnightPharmacyRows() {
  try {
    return await downloadEgenMidnightCsv();
  } catch (downloadError) {
    logError('E-Gen 자동 다운로드 실패 — Supabase 기존 데이터는 유지됩니다', downloadError);

    if (ALLOW_LOCAL_FALLBACK) {
      logInfo('ALLOW_LOCAL_CSV_FALLBACK 활성화 — 로컬 CSV 폴백 시도');
      try {
        return loadLocalFallbackCsv();
      } catch (fallbackError) {
        logError('로컬 폴백도 실패', fallbackError);
      }
    }

    throw downloadError;
  }
}

async function upsertBatches(supabase, rows) {
  let upserted = 0;

  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_BATCH_SIZE);
    const { error } = await supabase
      .from('night_pharmacies')
      .upsert(chunk, { onConflict: 'phone_normalized' });

    if (error) {
      throw new Error(`Upsert 실패 (batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}): ${error.message}`);
    }

    upserted += chunk.length;
    logInfo(`Supabase upsert 진행: ${upserted}/${rows.length}`);
  }

  return upserted;
}

function createSupabaseAdminClient(url, serviceRoleKey) {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      // Node.js(GitHub Actions 포함) — Realtime용 네이티브 WebSocket 폴리필
      WebSocket: ws,
    },
  });
}

async function main() {
  if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
    logError('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.');
    process.exit(1);
  }

  let rows;
  try {
    rows = await acquireMidnightPharmacyRows();
  } catch {
    logError(
      '동기화 중단 — 다운로드/파싱 실패로 Supabase upsert를 실행하지 않았습니다. 기존 DB 데이터는 그대로 유지됩니다.',
    );
    process.exit(1);
  }

  if (DRY_RUN) {
    logInfo(`Dry-run 완료: ${rows.length}건 파싱 (Supabase upsert 생략)`);
    return;
  }

  const supabase = createSupabaseAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    logInfo('Supabase upsert 시작…');
    const upserted = await upsertBatches(supabase, rows);
    logInfo(`완료: 심야약국 ${upserted}건 동기화 (${new Date().toISOString()})`);
  } catch (upsertError) {
    logError('Supabase upsert 실패 — 일부 배치만 반영되었을 수 있습니다', upsertError);
    process.exit(1);
  }
}

main().catch((error) => {
  logError('예기치 않은 오류', error);
  process.exit(1);
});
