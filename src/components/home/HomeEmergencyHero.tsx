import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { APP_FONT, APP_RADIUS } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import { navigateToMainTab } from '@/navigation/mainTabNavigation';
import { navigateToUtilityTool } from '@/navigation/utilityNavigation';
import { getLocationWithRegionImmediate } from '@/services/locationService';
import { KEMIX_TOUCH_MIN_HEIGHT } from '@/theme/kemixSemantic';
import type { MedicalMapTab } from '@/types/medicalMap';

type QuickActionTone = 'er' | 'health' | 'guide' | 'neutral';

type QuickAction = {
  id: string;
  label: string;
  subtitle: string;
  icon: AppIconName;
  tone: QuickActionTone;
  onPress: () => void;
};

function resolveIconTint(
  tone: QuickActionTone,
  colors: ReturnType<typeof useThemedColors>['colors'],
  status: ReturnType<typeof useThemedColors>['status'],
) {
  switch (tone) {
    case 'er':
      return { bg: colors.blueMuted, icon: colors.blue };
    case 'health':
      return { bg: status.open.bg, icon: status.open.icon };
    case 'guide':
      return { bg: colors.blueLight, icon: colors.blueSoft };
    default:
      return { bg: colors.surfaceElevated, icon: colors.textSecondary };
  }
}

function QuickActionTile({ action }: { action: QuickAction }) {
  const { colors, status } = useThemedColors();
  const tint = useMemo(
    () => resolveIconTint(action.tone, colors, status),
    [action.tone, colors, status],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${action.label}, ${action.subtitle}`}
      className="flex-1 active:opacity-85"
      style={{
        minHeight: KEMIX_TOUCH_MIN_HEIGHT + 12,
        borderRadius: APP_RADIUS.sm + 2,
        backgroundColor: colors.surfaceElevated,
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
      onPress={action.onPress}
    >
      <View
        className="items-center justify-center"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: tint.bg,
        }}
      >
        <AppIcon name={action.icon} size={20} color={tint.icon} />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="text-kemix-text"
          numberOfLines={1}
          style={{ fontFamily: APP_FONT.semibold, fontSize: 15, lineHeight: 20 }}
        >
          {action.label}
        </Text>
        <Text
          className="mt-0.5 text-kemix-muted"
          numberOfLines={1}
          style={{ fontFamily: APP_FONT.regular, fontSize: 12, lineHeight: 16 }}
        >
          {action.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function navigateMapTab(tab: MedicalMapTab) {
  navigateToMainTab('Map', { initialTab: tab });
}

/**
 * 홈 응급 퀵메뉴 — 미니멀 플랫 카드 (토스/애플 스타일)
 */
export function HomeEmergencyHero() {
  const { colors, semantic } = useThemedColors();
  const locationSnapshot = useMemo(() => getLocationWithRegionImmediate(), []);
  const regionLabel = locationSnapshot.region.label || '위치 확인';

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'er',
        label: '응급실',
        subtitle: '병상·거리',
        icon: 'hospital-box',
        tone: 'er',
        onPress: () => navigateMapTab('er'),
      },
      {
        id: 'aed',
        label: 'AED',
        subtitle: '가까운 설치 위치',
        icon: 'heart-pulse',
        tone: 'er',
        onPress: () => navigateMapTab('aed'),
      },
      {
        id: 'pharmacy',
        label: '약국',
        subtitle: '영업·심야 우선',
        icon: 'medical-bag',
        tone: 'health',
        onPress: () => navigateMapTab('pharmacy'),
      },
      {
        id: 'guide',
        label: '응급 가이드',
        subtitle: '처치 도움말',
        icon: 'book-open-page-variant',
        tone: 'guide',
        onPress: () => navigateToMainTab('Guide'),
      },
    ],
    [],
  );

  return (
    <View style={{ marginBottom: 24 }}>
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text
            className="text-kemix-text"
            style={{ fontFamily: APP_FONT.bold, fontSize: 20, lineHeight: 28 }}
          >
            응급·구급
          </Text>
          <Text
            className="mt-0.5 text-kemix-text-secondary"
            style={{ fontFamily: APP_FONT.regular, fontSize: 13, lineHeight: 18 }}
          >
            필요한 시설을 빠르게 찾아보세요
          </Text>
        </View>
        <View
          className="flex-row items-center rounded-full px-2.5 py-1"
          style={{ backgroundColor: colors.surfaceElevated }}
        >
          <AppIcon name="map-marker-outline" size={12} color={semantic.mutedText} />
          <Text
            className="ml-1 text-kemix-muted"
            numberOfLines={1}
            style={{ fontFamily: APP_FONT.medium, fontSize: 11, maxWidth: 96 }}
          >
            {regionLabel}
          </Text>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <View className="flex-row" style={{ gap: 8 }}>
          <QuickActionTile action={quickActions[0]} />
          <QuickActionTile action={quickActions[1]} />
        </View>
        <View className="flex-row" style={{ gap: 8 }}>
          <QuickActionTile action={quickActions[2]} />
          <QuickActionTile action={quickActions[3]} />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="응급 정보 및 위치 문자 열기"
        className="mt-3 flex-row items-center active:opacity-80"
        style={{ minHeight: KEMIX_TOUCH_MIN_HEIGHT, paddingHorizontal: 2 }}
        onPress={() => navigateToUtilityTool('EmergencyResponse')}
      >
        <AppIcon name="message-alert-outline" size={17} color={colors.blue} />
        <Text
          className="ml-2 flex-1 text-kemix-text"
          style={{ fontFamily: APP_FONT.medium, fontSize: 14 }}
        >
          응급 정보 · 위치 문자
        </Text>
        <AppIcon name="chevron-right" size={18} color={semantic.mutedText} />
      </Pressable>
    </View>
  );
}
