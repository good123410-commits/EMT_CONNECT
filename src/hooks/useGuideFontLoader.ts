import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import {
  DEFAULT_GUIDE_FONT_ID,
  getGuideFontOption,
  resolveGuideFontAsset,
} from '@/constants/guideFonts';

const loadedFontIds = new Set<string>([DEFAULT_GUIDE_FONT_ID]);
const loadingFontIds = new Map<string, Promise<string | undefined>>();
const FONT_LOAD_TIMEOUT_MS = 8_000;

function withFontTimeout<T>(promise: Promise<T>, fontId: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[guide-font] timeout: ${fontId}`));
    }, FONT_LOAD_TIMEOUT_MS);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function loadGuideFont(fontId: string): Promise<string | undefined> {
  const option = getGuideFontOption(fontId);
  const asset = option.assetKey ? resolveGuideFontAsset(option.assetKey) : undefined;
  if (!option.family || (!asset && !option.uri)) return undefined;
  if (loadedFontIds.has(fontId)) return option.family;

  const pending = loadingFontIds.get(fontId);
  if (pending) return pending;

  const source = asset ?? { uri: option.uri! };
  const promise = withFontTimeout(
    Font.loadAsync({ [option.family]: source }),
    fontId,
  )
    .then(() => {
      loadedFontIds.add(fontId);
      return option.family;
    })
    .catch((error) => {
      console.warn(`[guide-font] load failed: ${fontId}`, error);
      return undefined;
    })
    .finally(() => {
      loadingFontIds.delete(fontId);
    });

  loadingFontIds.set(fontId, promise);
  return promise;
}

export async function preloadGuideFonts(fontIds: string[]): Promise<void> {
  await Promise.all(fontIds.map((fontId) => loadGuideFont(fontId)));
}

export function useGuideFont(fontId: string): {
  fontFamily: string | undefined;
  loading: boolean;
} {
  const [fontFamily, setFontFamily] = useState<string | undefined>();
  const [loading, setLoading] = useState(fontId !== DEFAULT_GUIDE_FONT_ID);

  useEffect(() => {
    let active = true;

    if (fontId === DEFAULT_GUIDE_FONT_ID) {
      setFontFamily(undefined);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    void loadGuideFont(fontId).then((family) => {
      if (!active) return;
      setFontFamily(family);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [fontId]);

  return { fontFamily, loading };
}

export function useGuideFontCatalog(active: boolean): { ready: boolean } {
  // 폰트는 선택 시점에만 로드 — 앱 시작/모달 오픈 시 대량 프리로드 금지
  return { ready: active };
}
