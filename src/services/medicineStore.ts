import rawMedicineData from '../../assets/data/generated/medicine_data.json';
import {
  EMERGENCY_MEDICINE_DEFINITIONS,
  type EmergencyMedicineDefinition,
  type EmergencyMedicineQuickItem,
} from '@/constants/emergencyMedicines';
import type { MedicineInfo } from '@/services/emergencyApi';
import {
  getMedicineChoseongBucket,
  MEDICINE_CHOSEONG_FILTERS,
  type MedicineChoseongFilter,
} from '@/utils/medicineChoseong';

type RawMedicineRecord = {
  entpName?: string | null;
  itemName?: string | null;
  itemSeq?: string | null;
  efcyQesitm?: string | null;
  useMethodQesitm?: string | null;
  atpnWarnQesitm?: string | null;
  atpnQesitm?: string | null;
  intrcQesitm?: string | null;
  seQesitm?: string | null;
  depositMethodQesitm?: string | null;
  openDe?: string | null;
  updateDe?: string | null;
  itemImage?: string | null;
};

type IndexedMedicine = MedicineInfo & {
  searchKey: string;
  entpSearchKey: string;
  listSummary: string;
};

type ChoseongBuckets = Record<MedicineChoseongFilter, IndexedMedicine[]>;

type MedicineIndex = {
  all: IndexedMedicine[];
  choseongBuckets: ChoseongBuckets;
  emergencyItems: EmergencyMedicineQuickItem[];
};

const SOURCE = rawMedicineData as RawMedicineRecord[];
const SEARCH_RESULT_LIMIT = 100;
const BROWSE_RESULT_LIMIT = 300;
const DEFAULT_BROWSE_COUNT = 40;

let medicineIndex: MedicineIndex | null = null;

function readString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text;
}

function normalizeSearchText(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function mapRecord(record: RawMedicineRecord): MedicineInfo {
  return {
    itemName: readString(record.itemName),
    entpName: readString(record.entpName),
    itemSeq: readString(record.itemSeq),
    itemImage: readString(record.itemImage),
    efficacy: readString(record.efcyQesitm),
    usage: readString(record.useMethodQesitm),
    warningBeforeUse: readString(record.atpnWarnQesitm),
    precautions: readString(record.atpnQesitm),
    interactions: readString(record.intrcQesitm),
    sideEffects: readString(record.seQesitm),
    storage: readString(record.depositMethodQesitm),
    updatedAt: readString(record.updateDe, readString(record.openDe)),
  };
}

function hasUsableImage(item: MedicineInfo): boolean {
  return Boolean(item.itemImage?.trim());
}

function pickPreferredMedicine(current: MedicineInfo, candidate: MedicineInfo): MedicineInfo {
  const currentHasImage = hasUsableImage(current);
  const candidateHasImage = hasUsableImage(candidate);
  if (candidateHasImage && !currentHasImage) return candidate;
  if (currentHasImage && !candidateHasImage) return current;

  const currentScore = current.efficacy.length + current.usage.length;
  const candidateScore = candidate.efficacy.length + candidate.usage.length;
  return candidateScore > currentScore ? candidate : current;
}

function dedupeMedicines(items: MedicineInfo[]): MedicineInfo[] {
  const bySeq = new Map<string, MedicineInfo>();
  const withoutSeq: MedicineInfo[] = [];

  for (const item of items) {
    const seq = item.itemSeq.trim();
    if (!seq) {
      withoutSeq.push(item);
      continue;
    }

    const existing = bySeq.get(seq);
    if (!existing) {
      bySeq.set(seq, item);
      continue;
    }
    bySeq.set(seq, pickPreferredMedicine(existing, item));
  }

  return [...bySeq.values(), ...withoutSeq];
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toListSummary(efficacy: string): string {
  const text = stripHtml(efficacy);
  if (!text) return '효능 정보를 확인하려면 탭하세요';
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

function toIndexedMedicine(item: MedicineInfo): IndexedMedicine {
  return {
    ...item,
    searchKey: normalizeSearchText(item.itemName),
    entpSearchKey: normalizeSearchText(item.entpName),
    listSummary: toListSummary(item.efficacy),
  };
}

function createEmptyChoseongBuckets(): ChoseongBuckets {
  const buckets = {} as ChoseongBuckets;
  for (const filter of MEDICINE_CHOSEONG_FILTERS) {
    buckets[filter] = [];
  }
  return buckets;
}

function buildChoseongBuckets(items: IndexedMedicine[]): ChoseongBuckets {
  const buckets = createEmptyChoseongBuckets();
  for (const item of items) {
    const bucket = getMedicineChoseongBucket(item.itemName);
    if (bucket && bucket !== '전체') {
      buckets[bucket].push(item);
    }
  }
  return buckets;
}

function scoreMedicineMatch(item: IndexedMedicine, normalizedQuery: string): number {
  if (!normalizedQuery) return Number.MAX_SAFE_INTEGER;

  if (item.searchKey.startsWith(normalizedQuery)) return 0;
  const nameIndex = item.searchKey.indexOf(normalizedQuery);
  if (nameIndex >= 0) return 100 + nameIndex;

  const entpIndex = item.entpSearchKey.indexOf(normalizedQuery);
  if (entpIndex >= 0) return 500 + entpIndex;

  return Number.MAX_SAFE_INTEGER;
}

function resolveEmergencyMedicine(
  definition: EmergencyMedicineDefinition,
  items: IndexedMedicine[],
): MedicineInfo | null {
  for (const keyword of definition.keywords) {
    const normalizedKeyword = normalizeSearchText(keyword);
    if (!normalizedKeyword) continue;

    let best: IndexedMedicine | null = null;
    let bestScore = Number.MAX_SAFE_INTEGER;

    for (const item of items) {
      const score = scoreMedicineMatch(item, normalizedKeyword);
      if (score >= Number.MAX_SAFE_INTEGER) continue;
      if (score < bestScore) {
        best = item;
        bestScore = score;
      }
    }

    if (best) return best;
  }

  return null;
}

function buildMedicineIndex(): MedicineIndex {
  const deduped = dedupeMedicines(SOURCE.map(mapRecord))
    .filter((item) => item.itemName.trim().length > 0)
    .sort((a, b) => a.itemName.localeCompare(b.itemName, 'ko'));

  const all = deduped.map(toIndexedMedicine);
  const choseongBuckets = buildChoseongBuckets(all);
  const emergencyItems = EMERGENCY_MEDICINE_DEFINITIONS.map((definition) => ({
    definition,
    medicine: resolveEmergencyMedicine(definition, all),
  }));

  return { all, choseongBuckets, emergencyItems };
}

function getMedicineIndex(): MedicineIndex {
  if (!medicineIndex) {
    medicineIndex = buildMedicineIndex();
  }
  return medicineIndex;
}

export function getLocalMedicineCount(): number {
  return getMedicineIndex().all.length;
}

export function getDefaultBrowseMedicines(limit = DEFAULT_BROWSE_COUNT): MedicineInfo[] {
  return getMedicineIndex().all.slice(0, limit);
}

export function searchLocalMedicines(query: string, limit = SEARCH_RESULT_LIMIT): MedicineInfo[] {
  const normalizedQuery = normalizeSearchText(query.trim());
  if (!normalizedQuery) return [];

  const { all } = getMedicineIndex();
  const prefixMatches: IndexedMedicine[] = [];
  const nameContains: IndexedMedicine[] = [];
  const entpContains: IndexedMedicine[] = [];

  for (const item of all) {
    if (item.searchKey.startsWith(normalizedQuery)) {
      prefixMatches.push(item);
      continue;
    }
    if (item.searchKey.includes(normalizedQuery)) {
      nameContains.push(item);
      continue;
    }
    if (item.entpSearchKey.includes(normalizedQuery)) {
      entpContains.push(item);
    }
  }

  const sortByName = (a: IndexedMedicine, b: IndexedMedicine) =>
    a.itemName.localeCompare(b.itemName, 'ko');

  if (prefixMatches.length > 0) prefixMatches.sort(sortByName);
  if (nameContains.length > 0) nameContains.sort(sortByName);
  if (entpContains.length > 0) entpContains.sort(sortByName);

  const merged: IndexedMedicine[] = [];
  for (const group of [prefixMatches, nameContains, entpContains]) {
    for (const item of group) {
      merged.push(item);
      if (merged.length >= limit) return merged;
    }
  }

  return merged;
}

export function getBrowseMedicineCount(filter: MedicineChoseongFilter): number {
  const index = getMedicineIndex();
  if (filter === '전체') return index.all.length;
  return index.choseongBuckets[filter]?.length ?? 0;
}

export function browseLocalMedicinesByChoseong(
  filter: MedicineChoseongFilter,
  limit = BROWSE_RESULT_LIMIT,
  offset = 0,
): MedicineInfo[] {
  const index = getMedicineIndex();
  const source = filter === '전체' ? index.all : (index.choseongBuckets[filter] ?? []);
  return source.slice(offset, offset + limit);
}

export function getEmergencyMedicineQuickItems(): EmergencyMedicineQuickItem[] {
  return getMedicineIndex().emergencyItems;
}

export function getEmergencyMedicineQuickItemsBySection(
  section: EmergencyMedicineDefinition['section'],
): EmergencyMedicineQuickItem[] {
  return getEmergencyMedicineQuickItems().filter((item) => item.definition.section === section);
}

export function findLocalMedicineBySeq(itemSeq: string): MedicineInfo | null {
  const normalized = itemSeq.trim();
  if (!normalized) return null;
  return getMedicineIndex().all.find((item) => item.itemSeq === normalized) ?? null;
}
