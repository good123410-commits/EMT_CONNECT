import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import XLSX from 'xlsx';

const dataDir = join(process.cwd(), 'assets', 'data');
const files = readdirSync(dataDir).filter((f) => f.endsWith('.xlsx'));
console.log('files', files);

for (const file of files) {
  const path = join(dataDir, file);
  const wb = XLSX.readFile(path);
  console.log('\n===', file, '===');
  console.log('Sheets:', wb.SheetNames);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('Header:', rows[0]);
  console.log('Row1:', rows[1]);
  console.log('Row2:', rows[2]);
  console.log('Total rows:', rows.length);
}
