// scripts/process_medical_data.mjs — ES 모듈, process.cwd() 기준 경로 탐색
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import XLSX from 'xlsx';

const ROOT = process.cwd();
const OUTPUT_DIR = join(ROOT, 'src', 'data', 'generated');

/** 프로젝트 루트·src/data·assets/data 등 여러 후보에서 엑셀 탐색 */
const INPUT_DIRS = [
  join(ROOT, 'assets', 'data'),
  join(ROOT, 'src', 'data'),
  join(ROOT, 'data'),
  ROOT,
];

const METRO_SIDO = new Set([
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
]);

const PHARMACY_SIDO = new Set(['서울', '경기', '인천']);
const ER_TYPE_KEYWORDS = ['상급종합', '종합병원', '응급'];

function findXlsx(keyword) {
  const tried = [];

  for (const dir of INPUT_DIRS) {
    if (!existsSync(dir)) {
      tried.push(`${dir} (없음)`);
      continue;
    }

    let files;
    try {
      files = readdirSync(dir);
    } catch {
      tried.push(`${dir} (읽기 실패)`);
      continue;
    }

    const match = files.find(
      (name) =>
        (name.endsWith('.xlsx') || name.endsWith('.xls')) && name.includes(keyword),
    );

    if (match) {
      const fullPath = join(dir, match);
      console.log(`📂 [${keyword}] 발견: ${fullPath}`);
      return fullPath;
    }

    tried.push(`${dir} (${files.length}개 파일, 매칭 없음)`);
  }

  throw new Error(
    `'${keyword}' 엑셀을 찾지 못했습니다.\n탐색 경로:\n${tried.map((line) => `  - ${line}`).join('\n')}`,
  );
}

function normalizeName(value) {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
}

function parseNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function isValidCoord(lng, lat) {
  return lng !== 0 && lat !== 0 && lng >= 124 && lng <= 132 && lat >= 33 && lat <= 39;
}

function isErCapableHospital(typeName) {
  const type = String(typeName ?? '');
  return ER_TYPE_KEYWORDS.some((keyword) => type.includes(keyword));
}

function isMetroSido(sidoName) {
  const sido = String(sidoName ?? '');
  return [...METRO_SIDO].some((prefix) => sido.startsWith(prefix));
}

function isPharmacyRegion(sidoName) {
  const sido = String(sidoName ?? '');
  return [...PHARMACY_SIDO].some((prefix) => sido.startsWith(prefix));
}

function convertHospitals() {
  const path = findXlsx('병원정보');
  const wb = XLSX.readFile(path);
  const ws = wb.Sheets['hospBasisList'] ?? wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const items = [];
  const seen = new Set();

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row.length < 12) continue;

    const id = String(row[0] ?? '').trim();
    const name = String(row[1] ?? '').trim();
    const typeName = String(row[3] ?? '').trim();
    const sido = String(row[5] ?? '').trim();
    const sigungu = String(row[7] ?? '').trim();
    const address = String(row[10] ?? '').trim();
    const phone = String(row[11] ?? '').trim();
    const lng = parseNumber(row[row.length - 2]);
    const lat = parseNumber(row[row.length - 1]);

    if (!id || !name || !isValidCoord(lng, lat)) continue;

    const erCapable = isErCapableHospital(typeName);
    const metro = isMetroSido(sido);
    if (!erCapable && !metro) continue;
    if (!erCapable && metro && !typeName.includes('병원')) continue;

    const dedupeKey = `${normalizeName(name)}|${sigungu}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    items.push({
      i: id,
      n: name,
      a: address,
      p: phone,
      lng,
      lat,
      sg: sigungu,
      td: typeName,
      er: erCapable ? 1 : 0,
    });
  }

  items.sort((a, b) => a.n.localeCompare(b.n, 'ko'));
  return items;
}

function convertPharmacies() {
  const path = findXlsx('약국정보');
  const wb = XLSX.readFile(path);
  const ws = wb.Sheets['parmacyBasisList'] ?? wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const items = [];
  const seen = new Set();

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row.length < 12) continue;

    const id = String(row[0] ?? '').trim();
    const name = String(row[1] ?? '').trim();
    const sido = String(row[5] ?? '').trim();
    const sigungu = String(row[7] ?? '').trim();
    const address = String(row[10] ?? '').trim();
    const phone = String(row[11] ?? '').trim();
    const lng = parseNumber(row[row.length - 2]);
    const lat = parseNumber(row[row.length - 1]);

    if (!id || !name || !isValidCoord(lng, lat)) continue;
    if (!isPharmacyRegion(sido)) continue;

    const dedupeKey = `${normalizeName(name)}|${sigungu}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    items.push({
      i: id,
      n: name,
      a: address,
      p: phone,
      lng,
      lat,
      sg: sigungu,
    });
  }

  items.sort((a, b) => a.n.localeCompare(b.n, 'ko'));
  return items;
}

console.log(`🚀 의료 데이터 경량화 시작 (ROOT: ${ROOT})`);

mkdirSync(OUTPUT_DIR, { recursive: true });

const hospitals = convertHospitals();
const pharmacies = convertPharmacies();

const hospitalPath = join(OUTPUT_DIR, 'hospital_data.json');
const pharmacyPath = join(OUTPUT_DIR, 'pharmacy_data.json');
const summaryPath = join(OUTPUT_DIR, 'summary.json');

writeFileSync(hospitalPath, JSON.stringify(hospitals));
writeFileSync(pharmacyPath, JSON.stringify(pharmacies));

const summary = {
  generatedAt: new Date().toISOString(),
  rootDir: ROOT,
  outputDir: OUTPUT_DIR,
  hospitalCount: hospitals.length,
  pharmacyCount: pharmacies.length,
  hospitalSample: hospitals.slice(0, 3),
  pharmacySample: pharmacies.slice(0, 3),
};

writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(`\n✅ 병원 ${hospitals.length}곳 → ${hospitalPath}`);
console.log(`✅ 약국 ${pharmacies.length}곳 → ${pharmacyPath}`);
console.log(`📝 요약 → ${summaryPath}`);
