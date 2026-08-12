import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { APP_RADIUS, APP_SHADOW, APP_SPACING } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';

/** 응급처치 가이드 탭 상단 — 네이비/블루 메디컬 톤 */
export function GuideHeroBanner() {
  const { colors } = useThemedColors();
  const chips = [
    { icon: 'heart-outline' as const, label: '심폐소생' },
    { icon: 'bandage-outline' as const, label: '외상·출혈' },
    { icon: 'warning-outline' as const, label: '질식·기도' },
  ];

  return (
    <View
      className="mx-5 mb-4 overflow-hidden bg-kemix-surface"
      style={{
        marginTop: 16,
        borderRadius: APP_RADIUS.card,
        ...APP_SHADOW.cardSoft,
      }}
    >
      <View className="flex-row items-center" style={{ padding: 18 }}>
        <View
          className="h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.blueMuted }}
        >
          <Ionicons name="medkit-outline" size={28} color={colors.blue} />
        </View>
        <View className="ml-3 flex-1">
          <Text
            className="text-[11px] leading-4 tracking-wide"
            style={{ fontFamily: 'Pretendard-SemiBold', color: colors.blue }}
          >
            KEMIX Emergency Guide
          </Text>
          <Text
            className="mt-0.5 text-[17px] leading-6 text-kemix-text"
            style={{ fontFamily: 'Pretendard-Bold' }}
          >
            생활 응급처치 가이드
          </Text>
          <Text
            className="mt-1 text-[13px] leading-5 text-kemix-text-secondary"
            style={{ fontFamily: 'Pretendard' }}
          >
            심폐소생술 · 외상 · 질식 등 상황별 대처법을 확인하세요.
          </Text>
        </View>
      </View>
      <View
        className="flex-row"
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          backgroundColor: colors.blueLight,
          paddingHorizontal: APP_SPACING.card,
          paddingVertical: 10,
        }}
      >
        {chips.map((chip) => (
          <View key={chip.label} className="flex-1 flex-row items-center justify-center py-1">
            <Ionicons name={chip.icon} size={14} color={colors.tabActive} />
            <Text
              className="ml-1 text-[11px] leading-4"
              style={{ fontFamily: 'Pretendard-Medium', color: colors.navySoft }}
            >
              {chip.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
