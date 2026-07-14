import type { FontSource } from 'expo-font';

export type GuideFontSource = 'system' | 'google' | 'noonnu';

export type GuideFontOption = {
  id: string;
  label: string;
  source: GuideFontSource;
  /** React Native fontFamily after load */
  family?: string;
  /** Lazy-loaded bundled font key */
  assetKey?: string;
  /** Remote .otf / .ttf (눈누 CDN) */
  uri?: string;
};

export const DEFAULT_GUIDE_FONT_ID = 'system';
export const DEFAULT_GUIDE_FONT_SIZE = 16;

export const GUIDE_FONT_SIZE_OPTIONS = [14, 16, 18, 20, 24] as const;
export type GuideFontSize = (typeof GUIDE_FONT_SIZE_OPTIONS)[number];

export const GUIDE_FONT_OPTIONS: GuideFontOption[] = [
  { id: 'system', label: '기본체', source: 'system' },
  {
    id: 'noto-sans-kr',
    label: 'Noto Sans KR',
    source: 'google',
    family: 'NotoSansKR_400Regular',
    assetKey: 'noto-sans-kr',
  },
  {
    id: 'nanum-gothic',
    label: '나눔고딕',
    source: 'google',
    family: 'NanumGothic_400Regular',
    assetKey: 'nanum-gothic',
  },
  {
    id: 'nanum-myeongjo',
    label: '나눔명조',
    source: 'google',
    family: 'NanumMyeongjo_400Regular',
    assetKey: 'nanum-myeongjo',
  },
  {
    id: 'do-hyeon',
    label: 'Do Hyeon',
    source: 'google',
    family: 'DoHyeon_400Regular',
    assetKey: 'do-hyeon',
  },
  {
    id: 'jua',
    label: 'Jua',
    source: 'google',
    family: 'Jua_400Regular',
    assetKey: 'jua',
  },
  {
    id: 'black-han-sans',
    label: 'Black Han Sans',
    source: 'google',
    family: 'BlackHanSans_400Regular',
    assetKey: 'black-han-sans',
  },
  {
    id: 'pretendard',
    label: 'Pretendard',
    source: 'noonnu',
    family: 'GuideFont_Pretendard',
    uri: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/public/static/Pretendard-Regular.otf',
  },
  {
    id: 'rix-yeoljeongdo',
    label: '릭스열정도',
    source: 'noonnu',
    family: 'GuideFont_RixYeoljeongdo',
    uri: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2102-01@1.0/RixYeoljeongdo-Regular.ttf',
  },
  {
    id: 'yg-jalnan',
    label: '여기어때 잘난체',
    source: 'noonnu',
    family: 'GuideFont_YgJalnan',
    uri: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_four@1.0/JalnanOTF00.otf',
  },
];

const FONT_MAP = new Map(GUIDE_FONT_OPTIONS.map((option) => [option.id, option]));

/** 앱 시작 시 폰트 파일을 불러오지 않고, 선택 시점에만 require */
export function resolveGuideFontAsset(assetKey: string): FontSource | undefined {
  switch (assetKey) {
    case 'noto-sans-kr':
      return require('@expo-google-fonts/noto-sans-kr').NotoSansKR_400Regular;
    case 'nanum-gothic':
      return require('@expo-google-fonts/nanum-gothic').NanumGothic_400Regular;
    case 'nanum-myeongjo':
      return require('@expo-google-fonts/nanum-myeongjo').NanumMyeongjo_400Regular;
    case 'do-hyeon':
      return require('@expo-google-fonts/do-hyeon').DoHyeon_400Regular;
    case 'jua':
      return require('@expo-google-fonts/jua').Jua_400Regular;
    case 'black-han-sans':
      return require('@expo-google-fonts/black-han-sans').BlackHanSans_400Regular;
    default:
      return undefined;
  }
}

export function getGuideFontOption(fontId?: string | null): GuideFontOption {
  if (!fontId) return FONT_MAP.get(DEFAULT_GUIDE_FONT_ID)!;
  return FONT_MAP.get(fontId) ?? FONT_MAP.get(DEFAULT_GUIDE_FONT_ID)!;
}

export function normalizeGuideFontSize(size?: number | string | null): GuideFontSize {
  const parsed = typeof size === 'string' ? Number(size) : size;
  if (GUIDE_FONT_SIZE_OPTIONS.includes(parsed as GuideFontSize)) {
    return parsed as GuideFontSize;
  }
  return DEFAULT_GUIDE_FONT_SIZE;
}

export function getGuideTitleFontSize(bodySize: GuideFontSize): number {
  return Math.round(bodySize * 1.45);
}

export function getDownloadableGuideFontIds(): string[] {
  return GUIDE_FONT_OPTIONS.filter((option) => option.assetKey || option.uri).map(
    (option) => option.id,
  );
}

/** 앱 시작 시 프리로드 — 번들 폰트만 (CDN은 선택 시 로드) */
export function getBundledGuideFontIds(): string[] {
  return GUIDE_FONT_OPTIONS.filter((option) => option.assetKey).map((option) => option.id);
}
