import { View } from 'react-native';
import { useErBedStatusPalette } from '@/constants/erBedTheme';

type ErBedSkeletonProps = {
  compact?: boolean;
};

/** 실시간 병상 로딩 스켈레톤 — 레이아웃 시프트 방지 */
export function ErBedSkeleton({ compact = false }: ErBedSkeletonProps) {
  const palette = useErBedStatusPalette();

  return (
    <View>
      <View className="mb-1 flex-row justify-between">
        <View
          style={{
            width: 96,
            height: compact ? 10 : 12,
            borderRadius: 4,
            backgroundColor: palette.skeleton,
          }}
        />
        <View
          style={{
            width: 40,
            height: compact ? 10 : 12,
            borderRadius: 4,
            backgroundColor: palette.skeleton,
          }}
        />
      </View>
      <View
        className="overflow-hidden rounded-full"
        style={{
          height: compact ? 6 : 8,
          backgroundColor: palette.skeleton,
        }}
      />
    </View>
  );
}
