/**
 * GitHub Actions / CI에서 재난 티커 동기화용 환경 변수를 .env 파일로 materialize.
 * node scripts/ci/prepare-disaster-ticker-env.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT = join(ROOT, '.env.disaster-ticker.ci');

const SAFETY_KEYS = [
  'SAFETYDATA_SERVICE_KEY_WEATHER',
  'SAFETYDATA_SERVICE_KEY_FOREST',
  'SAFETYDATA_SERVICE_KEY_DISASTER',
  'SAFETYDATA_SERVICE_KEY',
  'EXPO_PUBLIC_SAFETYDATA_SERVICE_KEY',
  'EXPO_PUBLIC_PORTAL_API_KEY',
];

const SUPABASE_KEYS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

function log(...args) {
  console.log('[prepare-disaster-ticker-env]', ...args);
}

function maskKey(key) {
  if (!key) return '(없음)';
  if (key.length <= 4) return `(길이 ${key.length})`;
  return `${key.slice(0, 2)}...${key.slice(-2)} (길이 ${key.length})`;
}

function applyEnvLine(line, store) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eq = trimmed.indexOf('=');
  if (eq <= 0) return;
  const key = trimmed.slice(0, eq).trim();
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
  if (key && value && store[key] === undefined) {
    store[key] = value;
  }
}

function collectEnv() {
  const store = {};

  for (const key of [...SAFETY_KEYS, ...SUPABASE_KEYS]) {
    const value = process.env[key]?.trim();
    if (value) store[key] = value;
  }

  const bundled = process.env.DISASTER_TICKER_DOTENV?.trim();
  if (bundled) {
    for (const line of bundled.split(/\r?\n/)) {
      applyEnvLine(line, store);
    }
  }

  return store;
}

function hasAnySafetyKey(store) {
  return SAFETY_KEYS.some((key) => Boolean(store[key]?.trim()));
}

function main() {
  const store = collectEnv();

  log('환경 변수 진단:');
  for (const key of SAFETY_KEYS) {
    log(`  ${key}: ${maskKey(store[key])}`);
  }
  for (const key of SUPABASE_KEYS) {
    log(`  ${key}: ${store[key] ? '(설정됨)' : '(없음)'}`);
  }
  log(`  DISASTER_TICKER_DOTENV: ${process.env.DISASTER_TICKER_DOTENV?.trim() ? '(설정됨)' : '(없음)'}`);
  log(`  GITHUB_ACTIONS: ${process.env.GITHUB_ACTIONS ?? 'false'}`);

  if (!hasAnySafetyKey(store)) {
    console.error('');
    console.error('[prepare-disaster-ticker-env] fatal: 재난안전 API 키가 없습니다.');
    console.error('GitHub → Settings → Secrets and variables → Actions 에서 등록하세요.');
    console.error('');
    console.error('[권장] Secret 이름: DISASTER_TICKER_DOTENV');
    console.error('  SAFETYDATA_SERVICE_KEY_WEATHER=...');
    console.error('  SAFETYDATA_SERVICE_KEY_FOREST=...');
    console.error('  SAFETYDATA_SERVICE_KEY_DISASTER=...');
    console.error('  SUPABASE_URL=https://....supabase.co');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=sb_secret_...');
    console.error('');
    console.error('[또는] 개별 Secret:');
    console.error('  SAFETYDATA_SERVICE_KEY_WEATHER / _FOREST / _DISASTER');
    console.error('  (또는 공통 SAFETYDATA_SERVICE_KEY)');
    process.exitCode = 1;
    return;
  }

  const lines = Object.entries(store).map(([key, value]) => `${key}=${value}`);
  writeFileSync(OUTPUT, `${lines.join('\n')}\n`, 'utf8');
  log(`Wrote ${OUTPUT} (${lines.length} keys)`);
}

main();
