/**
 * E-Gen 심야약국 CSV → Supabase upsert
 *
 * 로컬 실행:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/sync-midnight-pharmacies.mjs
 *
 * GitHub Actions: .github/workflows/sync-pharmacies.yml (매일 00:00 UTC)
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
const CSV_PATH =
  process.env.MIDNIGHT_PHARMACY_CSV_PATH?.trim() ||
  join(ROOT, 'assets', 'data', 'midnight_pharmacy.csv');

const UPSERT_BATCH_SIZE = 200;

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

function loadMidnightPharmacyRows() {
  if (!existsSync(CSV_PATH)) {
    throw new Error(`심야약국 CSV를 찾을 수 없습니다: ${CSV_PATH}`);
  }

  const buffer = readFileSync(CSV_PATH);
  let csv;
  try {
    csv = new TextDecoder('euc-kr').decode(buffer);
  } catch {
    csv = buffer.toString('utf8');
  }

  const lines = csv.split(/\r?\n/).slice(2).filter((line) => line.trim());
  const rows = [];

  for (const line of lines) {
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
      source: 'egen_csv',
      synced_at: new Date().toISOString(),
    });
  }

  return rows;
}

async function upsertBatches(supabase, rows) {
  let upserted = 0;

  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_BATCH_SIZE);
    const { error } = await supabase
      .from('night_pharmacies')
      .upsert(chunk, { onConflict: 'phone_normalized' });

    if (error) {
      throw new Error(`Upsert 실패 (batch ${i / UPSERT_BATCH_SIZE + 1}): ${error.message}`);
    }

    upserted += chunk.length;
    console.log(`  · ${upserted}/${rows.length}건 처리`);
  }

  return upserted;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.');
    process.exit(1);
  }

  console.log('📥 E-Gen 심야약국 CSV 파싱 중…');
  console.log(`   경로: ${CSV_PATH}`);
  const rows = loadMidnightPharmacyRows();
  console.log(`✅ ${rows.length}건 파싱 완료`);

  if (rows.length === 0) {
    console.error('❌ 업서트할 데이터가 없습니다.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('☁️  Supabase upsert 시작…');
  const upserted = await upsertBatches(supabase, rows);
  console.log(`\n✅ 심야약국 ${upserted}건 동기화 완료 (${new Date().toISOString()})`);
}

main().catch((error) => {
  console.error('❌ 동기화 실패:', error instanceof Error ? error.message : error);
  process.exit(1);
});
