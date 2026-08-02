import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, Text, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_BORDER, APP_COLORS, APP_RADIUS } from '@/constants/appTheme';
import { KEMIX_WEB_URL } from '@/constants/env';
import { fetchActiveHomeEventBanners } from '@/services/homeBannerService';
import type { HomeBanner } from '@/types/homeDashboard';

type ShortcodeAdBannerProps = {
  bannerId?: string;
};

function resolveBannerLink(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|tel:|mailto:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) {
    const base = KEMIX_WEB_URL.trim().replace(/\/$/, '');
    return base ? `${base}${trimmed}` : trimmed;
  }
  return trimmed;
}

async function openBannerLink(url: string): Promise<void> {
  const resolved = resolveBannerLink(url);
  if (!resolved) return;

  if (/^tel:/i.test(resolved)) {
    await Linking.openURL(resolved).catch(() => undefined);
    return;
  }

  if (/^https?:\/\//i.test(resolved)) {
    await WebBrowser.openBrowserAsync(resolved);
    return;
  }

  await Linking.openURL(resolved).catch(() => undefined);
}

export function ShortcodeAdBanner({ bannerId }: ShortcodeAdBannerProps) {
  const [banner, setBanner] = useState<HomeBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void fetchActiveHomeEventBanners()
      .then((rows) => {
        if (cancelled) return;
        if (bannerId) {
          setBanner(rows.find((row) => row.id === bannerId) ?? rows[0] ?? null);
          return;
        }
        setBanner(rows[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setBanner(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bannerId]);

  if (loading) {
    return (
      <View
        className="my-4 items-center justify-center rounded-2xl border border-kemix-border bg-kemix-surface"
        style={{ minHeight: 120, ...APP_BORDER.card }}
      >
        <ActivityIndicator color={APP_COLORS.blue} />
      </View>
    );
  }

  if (!banner) {
    return null;
  }

  const handlePress = () => {
    const url = banner.linkUrl?.trim();
    if (!url) return;
    void openBannerLink(url);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`광고 배너: ${banner.title}`}
      onPress={handlePress}
      className="my-4 overflow-hidden rounded-2xl active:opacity-95"
      style={{
        borderRadius: APP_RADIUS.card,
        ...APP_BORDER.card,
        backgroundColor: APP_COLORS.surface,
      }}
    >
      {banner.imageUrl ? (
        <Image
          source={{ uri: banner.imageUrl }}
          style={{ width: '100%', height: 160 }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="items-center justify-center"
          style={{ height: 120, backgroundColor: APP_COLORS.surfaceElevated }}
        >
          <AppIcon name="image-outline" size={28} color={APP_COLORS.textMuted} />
        </View>
      )}
      <View className="px-4 py-3">
        <Text className="text-[10px] font-bold uppercase tracking-wide text-kemix-muted">Sponsored</Text>
        <Text className="mt-1 text-base font-bold text-kemix-text">{banner.title}</Text>
        {banner.description?.trim() ? (
          <Text className="mt-1 text-sm leading-5 text-kemix-text-secondary" numberOfLines={2}>
            {banner.description}
          </Text>
        ) : null}
        {banner.linkUrl?.trim() ? (
          <View className="mt-2 flex-row items-center">
            <Text className="text-xs font-semibold text-blue-600">자세히 보기</Text>
            <AppIcon name="chevron-right" size={16} color={APP_COLORS.blue} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
