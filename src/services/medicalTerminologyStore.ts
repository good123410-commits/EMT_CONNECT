import rawTerminology from '../../assets/data/generated/kmle_all_terminology.json';
import type { MedicalTerminology, TerminologyCategoryFilter } from '@/types/medicalTerminology';

type IndexedTerminology = MedicalTerminology & {
  koreanKey: string;
  englishKey: string;
};

type TerminologyIndex = {
  all: IndexedTerminology[];
  byCategory: Map<string, IndexedTerminology[]>;
};

const SOURCE = rawTerminology as MedicalTerminology[];
const SEARCH_RESULT_LIMIT = 200;

let terminologyIndex: TerminologyIndex | null = null;

function normalizeSearchText(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function toIndexedTerm(term: MedicalTerminology): IndexedTerminology {
  return {
    ...term,
    koreanKey: normalizeSearchText(term.korean),
    englishKey: normalizeSearchText(term.english),
  };
}

function buildTerminologyIndex(): TerminologyIndex {
  const all = SOURCE.filter((term) => term.korean.trim() && term.english.trim()).map(toIndexedTerm);
  const byCategory = new Map<string, IndexedTerminology[]>();

  for (const term of all) {
    const bucket = byCategory.get(term.category);
    if (bucket) {
      bucket.push(term);
    } else {
      byCategory.set(term.category, [term]);
    }
  }

  return { all, byCategory };
}

function getTerminologyIndex(): TerminologyIndex {
  if (!terminologyIndex) {
    terminologyIndex = buildTerminologyIndex();
  }
  return terminologyIndex;
}

function getCategoryPool(category: TerminologyCategoryFilter): IndexedTerminology[] {
  const index = getTerminologyIndex();
  if (category === '전체') return index.all;
  return index.byCategory.get(category) ?? [];
}

function scoreTermMatch(term: IndexedTerminology, normalizedQuery: string): number {
  if (term.koreanKey.startsWith(normalizedQuery)) return 0;
  const koreanIndex = term.koreanKey.indexOf(normalizedQuery);
  if (koreanIndex >= 0) return 100 + koreanIndex;

  if (term.englishKey.startsWith(normalizedQuery)) return 200;
  const englishIndex = term.englishKey.indexOf(normalizedQuery);
  if (englishIndex >= 0) return 300 + englishIndex;

  return Number.MAX_SAFE_INTEGER;
}

export function getMedicalTerminologyCount(): number {
  return getTerminologyIndex().all.length;
}

export function browseMedicalTerminology(
  category: TerminologyCategoryFilter,
  limit = SEARCH_RESULT_LIMIT,
): MedicalTerminology[] {
  return getCategoryPool(category).slice(0, limit);
}

export function searchMedicalTerminology(
  query: string,
  category: TerminologyCategoryFilter = '전체',
  limit = SEARCH_RESULT_LIMIT,
): MedicalTerminology[] {
  const normalizedQuery = normalizeSearchText(query.trim());
  const pool = getCategoryPool(category);

  if (!normalizedQuery) {
    return pool.slice(0, limit);
  }

  return pool
    .map((term) => ({ term, score: scoreTermMatch(term, normalizedQuery) }))
    .filter(({ score }) => score < Number.MAX_SAFE_INTEGER)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.term.korean.localeCompare(b.term.korean, 'ko');
    })
    .slice(0, limit)
    .map(({ term }) => term);
}

export function getMedicalTerminologyCategoryCount(category: TerminologyCategoryFilter): number {
  return getCategoryPool(category).length;
}
