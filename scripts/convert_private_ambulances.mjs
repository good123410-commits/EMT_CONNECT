/**
 * private_ambulances.csv → src/data/generated/private_ambulances.json
 *
 * CSV 형식 (헤더 없음, EUC-KR):
 * 기관명,차종,차량번호,대표전화,시도,시군구
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CSV_PATH = path.join(ROOT, 'src', 'data', 'private_ambulances.csv');
const OUT_PATH = path.join(ROOT, 'src', 'data', 'generated', 'private_ambulances.json');

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

const csvBuffer = fs.readFileSync(CSV_PATH);
const csvText = new TextDecoder('euc-kr').decode(csvBuffer);
const lines = csvText.split(/\r?\n/).filter((line) => line.trim());

/** 기관+지역+전화 기준 중복 제거, 차종·대수 집계 */
const grouped = new Map();

for (const line of lines) {
  const row = parseCsvLine(line);
  if (row.length < 6) continue;

  const [name, vehicleType, , phone, sido, sigungu] = row;
  if (!name || !phone) continue;

  const sd = sido.trim();
  const sg = sigungu.trim();
  const key = `${name}|${sd}|${sg}|${phone.trim()}`;

  const existing = grouped.get(key);
  if (existing) {
    existing.types.add(vehicleType.trim());
    existing.vehicleCount += 1;
    continue;
  }

  grouped.set(key, {
    n: name.trim(),
    types: new Set([vehicleType.trim()]),
    p: phone.trim(),
    sd,
    sg,
    vehicleCount: 1,
  });
}

const records = [...grouped.values()].map((entry, index) => {
  const typeLabel = [...entry.types].filter(Boolean).sort().join(' · ');
  const regionLabel = entry.sg ? `${entry.sd} ${entry.sg}` : entry.sd;

  return {
    i: `PA-${String(index + 1).padStart(4, '0')}`,
    n: entry.n,
    t: typeLabel,
    vc: entry.vehicleCount,
    r: regionLabel,
    a: regionLabel,
    p: entry.p,
    lat: null,
    lng: null,
    sd: entry.sd,
    sg: entry.sg,
  };
});

records.sort((a, b) => {
  const region = a.sd.localeCompare(b.sd, 'ko');
  if (region !== 0) return region;
  const sg = a.sg.localeCompare(b.sg, 'ko');
  if (sg !== 0) return sg;
  return a.n.localeCompare(b.n, 'ko');
});

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(records));
console.log(`Wrote ${records.length} records → ${OUT_PATH}`);
console.log(`With phone: ${records.filter((r) => r.p).length}`);
