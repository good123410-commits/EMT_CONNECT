import { writeFileSync, mkdirSync, readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import XLSX from 'xlsx';

const ROOT = process.cwd();
const INPUT_DIRS = [join(ROOT, 'src', 'data'), join(ROOT, 'assets', 'data')];
const OUTPUT_DIR = join(ROOT, 'src', 'data', 'generated');

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
  for (const dir of INPUT_DIRS) {
    if (!existsSync(dir)) continue;
    const match = readdirSync(dir).find((name) => name.includes(keyword) && name.endsWith('.xlsx'));
    if (match) return join(dir, match);
  }
  throw new Error(`xlsx not found for keyword: ${keyword}`);
}

function normalizeName(value) {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
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

/** 심야약국 CSV — 요일별 운영시간 (EUC-KR) */
function loadMidnightPharmacyHours() {
  const path = join(ROOT, 'assets', 'data', 'midnight_pharmacy.csv');
  if (!existsSync(path)) return new Map();

  const csv = new TextDecoder('euc-kr').decode(readFileSync(path));
  const lines = csv.split(/\r?\n/).slice(2).filter((line) => line.trim());
  const byPhone = new Map();

  for (const line of lines) {
    const cols = parseCsvLine(line);
    const phone = normalizePhone(cols[1]);
    const weeklyHours = cols.slice(4, 12).map((value) => String(value ?? '').trim());
    if (phone && weeklyHours.some(Boolean)) {
      byPhone.set(phone, weeklyHours);
    }
  }

  return byPhone;
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

function findColumnIndex(headerRow, candidates) {
  for (let i = 0; i < headerRow.length; i += 1) {
    const cell = String(headerRow[i] ?? '');
    if (candidates.some((name) => cell.includes(name))) return i;
  }
  return -1;
}

function readCoordPair(row, headerRow) {
  const xIdx = findColumnIndex(headerRow, ['좌표(X)', '좌표X', 'X좌표']);
  const yIdx = findColumnIndex(headerRow, ['좌표(Y)', '좌표Y', 'Y좌표']);

  let lng = xIdx >= 0 ? parseNumber(row[xIdx]) : 0;
  let lat = yIdx >= 0 ? parseNumber(row[yIdx]) : 0;

  if (!isValidCoord(lng, lat) && row.length >= 2) {
    lng = parseNumber(row[row.length - 2]);
    lat = parseNumber(row[row.length - 1]);
  }

  if (!isValidCoord(lng, lat) && lat >= 124 && lat <= 132 && lng >= 33 && lng <= 39) {
    return { lng: lat, lat: lng };
  }

  return { lng, lat };
}

function convertHospitals() {
  const path = findXlsx('병원정보');
  const wb = XLSX.readFile(path);
  const ws = wb.Sheets['hospBasisList'] ?? wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const headerRow = rows[0] ?? [];

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
    const { lng, lat } = readCoordPair(row, headerRow);

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
      x: lng,
      y: lat,
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
  const headerRow = rows[0] ?? [];
  const midnightHoursByPhone = loadMidnightPharmacyHours();

  const items = [];
  const seen = new Set();
  let hoursLinked = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row.length < 12) continue;

    const id = String(row[0] ?? '').trim();
    const name = String(row[1] ?? '').trim();
    const sigungu = String(row[7] ?? '').trim();
    const address = String(row[10] ?? '').trim();
    const phone = String(row[11] ?? '').trim();
    const { lng, lat } = readCoordPair(row, headerRow);

    if (!id || !name || !isValidCoord(lng, lat)) continue;

    const dedupeKey = `${normalizeName(name)}|${sigungu}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const weeklyHours = midnightHoursByPhone.get(normalizePhone(phone));
    const record = {
      i: id,
      n: name,
      a: address,
      p: phone,
      lng,
      lat,
      x: lng,
      y: lat,
      sg: sigungu,
    };
    if (weeklyHours) {
      record.wh = weeklyHours;
      hoursLinked += 1;
    }

    items.push(record);
  }

  items.sort((a, b) => a.n.localeCompare(b.n, 'ko'));
  console.log(`pharmacy hours linked: ${hoursLinked}`);
  return items;
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const hospitals = convertHospitals();
const pharmacies = convertPharmacies();

writeFileSync(join(OUTPUT_DIR, 'hospital_data.json'), JSON.stringify(hospitals));
writeFileSync(join(OUTPUT_DIR, 'pharmacy_data.json'), JSON.stringify(pharmacies));

const summary = {
  generatedAt: new Date().toISOString(),
  hospitalCount: hospitals.length,
  pharmacyCount: pharmacies.length,
  hospitalSample: hospitals.slice(0, 3),
  pharmacySample: pharmacies.slice(0, 3),
};

writeFileSync(join(OUTPUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
