import { ActivityIndicator, Text, View } from 'react-native';
import { SegmentControl } from '@/components/SegmentControl';
import { APP_FONT } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import type { PharmacyListViewMode } from '@/utils/pharmacyListSort';

const PHARMACY_VIEW_OPTIONS: { value: PharmacyListViewMode; label: string }[] = [
  { value: 'distance', label: '현재 위치 기준' },
  { value: 'night-priority', label: '심야약국 우선' },
];

type PharmacyViewModeToggleProps = {
  value: PharmacyListViewMode;
  gpsLoading?: boolean;
  onChange: (mode: PharmacyListViewMode) => void;
  onActivateGps: () => void;
};

/**
 * 약국 탭 전용 리스트 보기 모드 토글 (SRP — FacilitySearchBarComponent와 분리)
 */
export function PharmacyViewModeToggle({
  value,
  gpsLoading = false,
  onChange,
  onActivateGps,
}: PharmacyViewModeToggleProps) {
  const { status } = useThemedColors();

  const handleChange = (next: PharmacyListViewMode) => {
    onChange(next);
    if (next === 'distance') {
      void onActivateGps();
    }
  };

  return (
    <View className="gap-2">
      <SegmentControl
        options={PHARMACY_VIEW_OPTIONS}
        value={value}
        onChange={handleChange}
      />
      {gpsLoading && value === 'distance' ? (
        <View className="flex-row items-center justify-center gap-2 py-1">
          <ActivityIndicator size="small" color={status.gps.icon} />
          <Text
            className="text-kemix-text-secondary"
            style={{ fontFamily: APP_FONT.medium, fontSize: 13 }}
          >
            위치 확인 중...
          </Text>
        </View>
      ) : null}
      {value === 'night-priority' ? (
        <Text
          className="text-center text-kemix-muted"
          style={{ fontFamily: APP_FONT.regular, fontSize: 13 }}
        >
          금일 심야·영업 중 약국을 상단에 표시합니다
        </Text>
      ) : null}
    </View>
  );
}
