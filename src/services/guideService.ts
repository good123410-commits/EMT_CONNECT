import {
  normalizeGuideSeverity,
  type GuideSeverity,
} from '@/constants/guideSeverity';
import {
  DEFAULT_GUIDE_FONT_ID,
  DEFAULT_GUIDE_FONT_SIZE,
  normalizeGuideFontSize,
  type GuideFontSize,
} from '@/constants/guideFonts';
import { resolveGuideIcon, type GuideIconId } from '@/constants/guideIcons';
import {
  buildCategoryIconMap,
  fetchGuideCategories,
  type GuideCategory,
} from '@/services/guideCategoryService';
import {
  serializeGuideContent,
  parseGuideContent,
} from '@/utils/guideContentFormat';
import { subscribeEmergencyGuidesTable } from '@/lib/realtimeSubscription';
import { supabase } from '@/lib/supabaseClient';

export const EMERGENCY_GUIDES_TABLE = 'emergency_guides';

/** Supabase `public.emergency_guides` 행 */
export type EmergencyGuide = {
  id: string;
  title: string;
  content: string;
  category: string;
  severity: GuideSeverity;
  fontId: string;
  fontSize: GuideFontSize;
  created_at: string;
};

export type GuideDisplayStep = {
  order: number;
  title: string;
  description: string;
};

export type GuideDisplay = {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: string;
  severity: GuideSeverity;
  fontId: string;
  fontSize: GuideFontSize;
  summary: string;
  steps: GuideDisplayStep[];
  warnings: string[];
  rawContent: string;
};

export type CreateEmergencyGuideInput = {
  title: string;
  category: string;
  content: string;
  severity: GuideSeverity;
  fontId?: string;
  fontSize?: GuideFontSize;
};

type EmergencyGuideRow = {
  id: string;
  title: string;
  category: string;
  created_at: string;
  content?: string | null;
  severity?: string | null;
  font_id?: string | null;
  font_size?: number | string | null;
  steps?: string | null;
  precautions?: string | null;
};

const WARNING_MARKERS = ['주의사항', '주의', '※ 주의'];

function buildContentExcerpt(content: string, maxLength = 120): string {
  const plain = content.replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trim()}…`;
}

function combineLegacyContent(steps?: string | null, precautions?: string | null): string {
  const parts = [steps?.trim(), precautions?.trim() ? `주의사항:\n${precautions.trim()}` : '']
    .filter(Boolean)
    .join('\n\n');
  return parts;
}

function normalizeGuideRow(row: EmergencyGuideRow): EmergencyGuide {
  const rawStored =
    typeof row.content === 'string' && row.content.trim()
      ? row.content.trim()
      : combineLegacyContent(row.steps, row.precautions);

  const { body, meta } = parseGuideContent(rawStored);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    content: body,
    severity: normalizeGuideSeverity(row.severity, row.category),
    fontId: row.font_id?.trim() || meta?.fontId || DEFAULT_GUIDE_FONT_ID,
    fontSize: normalizeGuideFontSize(row.font_size ?? meta?.fontSize ?? DEFAULT_GUIDE_FONT_SIZE),
    created_at: row.created_at,
  };
}

function isMissingColumnError(message: string, column: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes(column.toLowerCase()) &&
    (normalized.includes('does not exist') ||
      normalized.includes('could not find') ||
      normalized.includes('schema cache'))
  );
}

/** DB에 실제 존재하는 컬럼만 조회 (*). 마이그레이션 전후 스키마 모두 호환 */
async function queryEmergencyGuideRows(category?: string): Promise<EmergencyGuideRow[]> {
  let query = supabase.from(EMERGENCY_GUIDES_TABLE).select('*').order('created_at', {
    ascending: false,
  });

  if (category?.trim()) {
    query = query.eq('category', category.trim());
  }

  let { data, error } = await query;

  if (error && isMissingColumnError(error.message, 'created_at')) {
    let fallbackQuery = supabase.from(EMERGENCY_GUIDES_TABLE).select('*');
    if (category?.trim()) {
      fallbackQuery = fallbackQuery.eq('category', category.trim());
    }
    ({ data, error } = await fallbackQuery);
  }

  if (error) {
    throw new Error(`응급처치 가이드 조회 실패: ${error.message}`);
  }

  return (data ?? []) as EmergencyGuideRow[];
}

export async function fetchEmergencyGuides(category?: string): Promise<EmergencyGuide[]> {
  const rows = await queryEmergencyGuideRows(category);
  return rows.map((row) => normalizeGuideRow(row));
}

export async function fetchEmergencyGuideById(id: string): Promise<EmergencyGuide | null> {
  const { data, error } = await supabase
    .from(EMERGENCY_GUIDES_TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`응급처치 가이드 조회 실패: ${error.message}`);
  }

  if (!data) return null;
  return normalizeGuideRow(data as EmergencyGuideRow);
}

export async function searchEmergencyGuides(
  query: string,
  categoryFilter = '',
): Promise<EmergencyGuide[]> {
  const guides = await fetchEmergencyGuides(categoryFilter || undefined);
  const q = query.trim().toLowerCase();
  if (!q) return guides;

  return guides.filter(
    (guide) =>
      guide.title.toLowerCase().includes(q) ||
      guide.category.toLowerCase().includes(q) ||
      guide.content.toLowerCase().includes(q),
  );
}

export async function createEmergencyGuide(
  input: CreateEmergencyGuideInput,
): Promise<EmergencyGuide> {
  const title = input.title.trim();
  const category = input.category.trim();
  const content = input.content.trim();

  if (!title || !content) {
    throw new Error('제목과 내용을 입력해 주세요.');
  }

  if (!category) {
    throw new Error('분류를 선택해 주세요.');
  }

  const fontId = input.fontId?.trim() || DEFAULT_GUIDE_FONT_ID;
  const fontSize = normalizeGuideFontSize(input.fontSize ?? DEFAULT_GUIDE_FONT_SIZE);
  const serializedContent = serializeGuideContent(content, { fontId, fontSize });

  const payloadWithTypography = {
    title,
    category,
    content: serializedContent,
    severity: input.severity,
    font_id: fontId,
    font_size: fontSize,
  };

  let result = await supabase
    .from(EMERGENCY_GUIDES_TABLE)
    .insert(payloadWithTypography)
    .select('*')
    .single();

  if (result.error && isMissingColumnError(result.error.message, 'font_id')) {
    const payloadWithMetaContent = {
      title,
      category,
      content: serializedContent,
      severity: input.severity,
    };
    result = await supabase
      .from(EMERGENCY_GUIDES_TABLE)
      .insert(payloadWithMetaContent)
      .select('*')
      .single();
  }

  if (result.error && isMissingColumnError(result.error.message, 'severity')) {
    result = await supabase
      .from(EMERGENCY_GUIDES_TABLE)
      .insert({ title, category, content: serializedContent })
      .select('*')
      .single();
  }

  if (result.error) {
    throw new Error(`가이드 저장 실패: ${result.error.message}`);
  }

  return normalizeGuideRow(result.data as EmergencyGuideRow);
}

export async function deleteEmergencyGuide(id: string): Promise<void> {
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error('삭제할 가이드를 찾을 수 없습니다.');
  }

  const { data, error } = await supabase
    .from(EMERGENCY_GUIDES_TABLE)
    .delete()
    .eq('id', trimmedId)
    .select('id');

  if (error) {
    throw new Error(`가이드 삭제 실패: ${error.message}`);
  }

  if (!data?.length) {
    throw new Error(
      '가이드가 삭제되지 않았습니다. Supabase에서 emergency_guides DELETE 정책을 확인해 주세요.',
    );
  }
}

export function subscribeEmergencyGuides(onChange: () => void): () => void {
  return subscribeEmergencyGuidesTable(onChange);
}

export function parseGuideSteps(steps: string): string[] {
  return steps
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitContentSections(content: string): { body: string; warnings: string[] } {
  for (const marker of WARNING_MARKERS) {
    const index = content.indexOf(marker);
    if (index >= 0) {
      const body = content.slice(0, index).trim();
      const warningBlock = content.slice(index + marker.length).replace(/^[:\s]+/, '').trim();
      return {
        body,
        warnings: parseGuideSteps(warningBlock),
      };
    }
  }

  return { body: content.trim(), warnings: [] };
}

function parseStepLine(line: string, fallbackOrder: number): GuideDisplayStep {
  const numbered = line.match(/^(\d+)\.\s*(.+)$/);
  if (numbered) {
    const order = Number(numbered[1]);
    const body = numbered[2].trim();
    const splitIndex = body.search(/[:：]/);

    if (splitIndex > 0) {
      return {
        order,
        title: body.slice(0, splitIndex).trim(),
        description: body.slice(splitIndex + 1).trim(),
      };
    }

    return {
      order,
      title: `단계 ${order}`,
      description: body,
    };
  }

  return {
    order: fallbackOrder,
    title: `단계 ${fallbackOrder}`,
    description: line,
  };
}

export function toGuideDisplay(
  guide: EmergencyGuide,
  categoryIconMap: Record<string, GuideIconId> = {},
): GuideDisplay {
  const { body, warnings } = splitContentSections(guide.content);
  const stepLines = parseGuideSteps(body).filter((line) => /^\d+\./.test(line));
  const steps = stepLines.length
    ? stepLines.map((line, index) => parseStepLine(line, index + 1))
    : [];

  const summarySource = buildContentExcerpt(guide.content) || guide.title;
  const icon = resolveGuideIcon(categoryIconMap[guide.category]);

  return {
    id: guide.id,
    category: guide.category,
    title: guide.title,
    subtitle: guide.category,
    icon,
    severity: guide.severity,
    fontId: guide.fontId,
    fontSize: guide.fontSize,
    summary: summarySource,
    steps,
    warnings,
    rawContent: guide.content,
  };
}

export type GuideListResult = {
  guides: GuideDisplay[];
  categories: GuideCategory[];
};

export async function fetchGuideList(
  searchText = '',
  categoryFilter = '',
): Promise<GuideListResult> {
  const categories = await fetchGuideCategories();
  const iconMap = buildCategoryIconMap(categories);
  const guides = await searchEmergencyGuides(searchText, categoryFilter);

  return {
    categories,
    guides: guides.map((guide) => toGuideDisplay(guide, iconMap)),
  };
}

export async function fetchGuideDisplays(
  searchText = '',
  categoryFilter = '',
): Promise<GuideDisplay[]> {
  const result = await fetchGuideList(searchText, categoryFilter);
  return result.guides;
}
