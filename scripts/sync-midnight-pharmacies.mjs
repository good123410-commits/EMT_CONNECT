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

const DRY_RUN = process.argv.includes('--dry-run');

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

  for (let attempt = 1; attempt <= DOWNLOAD_MAX_RETRIES; attempt += 1) {
    try {
      logInfo(`E-Gen CSV 다운로드 시도 ${attempt}/${DOWNLOAD_MAX_RETRIES}: ${EGEN_CSV_URL}`);

      const response = await fetch(EGEN_CSV_URL, {
        method: 'GET',
        headers: {
          Accept: 'text/csv, application/vnd.ms-excel, application/octet-stream, */*',
          'User-Agent': 'EMS-Connect-Pharmacy-Sync/1.0 (+https://github.com)',
          Referer: EGEN_REFERER,
        },
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
      logError(`다운로드 실패 (시도 ${attempt})`, error);
      if (attempt < DOWNLOAD_MAX_RETRIES) {
        await sleep(1500 * attempt);
      }
    }
  }

  throw new Error(
    `E-Gen CSV 다운로드 최종 실패 (${DOWNLOAD_MAX_RETRIES}회): ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
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

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

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
