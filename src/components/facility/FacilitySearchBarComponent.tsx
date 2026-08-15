import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FacilityGpsActivateButton } from '@/components/facility/FacilityGpsActivateButton';
import { PharmacyViewModeToggle } from '@/components/facility/PharmacyViewModeToggle';
import { RegionPickerModal } from '@/components/facility/RegionPickerModal';
import { APP_FONT } from '@/constants/appTheme';
import type { FacilitySearchMode } from '@/hooks/useFacilitySearchMode';
import { useThemedColors } from '@/hooks/useThemedColors';
import { KEMIX_TOUCH_MIN_HEIGHT } from '@/theme/kemixSemantic';
import type { PharmacyListViewMode } from '@/utils/pharmacyListSort';
import { getSidoOptions, getSigunguOptionsForSido } from '@/utils/regionOptions';

export type FacilitySearchBarComponentProps = {
  facilityLabel: 'AED' | '병원' | '약국' | '소아' | '쉼터';
  mode: FacilitySearchMode;
  sido: string;
  sigungu: string;
  gpsLoading?: boolean;
  statusLabel?: string;
  resultCount?: number;
  onActivateGps: () => void;
  onSidoChange: (value: string) => void;
  onSigunguChange: (value: string) => void;
  /** 약국 탭 전용 — PharmacyViewModeToggle에 전달 */
  pharmacyListViewMode?: PharmacyListViewMode;
  onPharmacyListViewModeChange?: (mode: PharmacyListViewMode) => void;
};

type PickerTarget = 'sido' | 'sigungu' | null;

type RegionSelectFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  onPress: () => void;
};

function RegionSelectField({
  label,
  value,
  placeholder,
  disabled = false,
  onPress,
}: RegionSelectFieldProps) {
  const { semantic } = useThemedColors();
  const display = value || placeholder;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} 선택, 현재 ${display}`}
      accessibilityState={{ disabled }}
      className="flex-1 flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-surface px-3"
      style={{ minHeight: KEMIX_TOUCH_MIN_HEIGHT, opacity: disabled ? 0.55 : 1 }}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        className="text-sm"
        numberOfLines={1}
        style={{
          fontFamily: value ? APP_FONT.medium : APP_FONT.regular,
          color: value ? semantic.text : semantic.mutedText,
        }}
      >
        {display}
      </Text>
      <Ionicons name="chevron-down" size={16} color={semantic.mutedText} />
    </Pressable>
  );
}

/**
 * AED · 병원 · 약국 · 소아 공통 지역 선택 UI
 * - 시·도 / 시·군·구 드롭다운 즉시 조회
 * - GPS 버튼 또는 약국 전용 PharmacyViewModeToggle
 */
export function FacilitySearchBarComponent({
  facilityLabel,
  mode,
  sido,
  sigungu,
  gpsLoading = false,
  statusLabel,
  resultCount,
  onActivateGps,
  onSidoChange,
  onSigunguChange,
  pharmacyListViewMode = 'distance',
  onPharmacyListViewModeChange,
}: FacilitySearchBarComponentProps) {
  const [picker, setPicker] = useState<PickerTarget>(null);

  const sidoOptions = useMemo(() => [...getSidoOptions()], []);
  const sigunguOptions = useMemo(
    () => (sido ? getSigunguOptionsForSido(sido) : []),
    [sido],
  );

  const gpsActive = mode === 'gps';
  const showPharmacyViewToggle =
    facilityLabel === '약국' && typeof onPharmacyListViewModeChange === 'function';
  const nightPriorityActive =
    showPharmacyViewToggle && pharmacyListViewMode === 'night-priority';

  return (
    <View className="gap-3">
      <View>
        <Text
          className="mb-2 text-kemix-text-secondary"
          style={{ fontFamily: APP_FONT.semibold, fontSize: 12 }}
        >
          지역 선택
        </Text>
        <View className="flex-row gap-2">
          <RegionSelectField
            label="시·도"
            value={sido}
            placeholder="시·도"
            onPress={() => setPicker('sido')}
          />
          <RegionSelectField
            label="시·군·구"
            value={sigungu}
            placeholder="전체"
            disabled={!sido}
            onPress={() => sido && setPicker('sigungu')}
          />
        </View>
      </View>

      {showPharmacyViewToggle ? (
        <PharmacyViewModeToggle
          value={pharmacyListViewMode}
          gpsLoading={gpsLoading}
          onChange={onPharmacyListViewModeChange}
          onActivateGps={onActivateGps}
        />
      ) : (
        <FacilityGpsActivateButton
          active={gpsActive}
          loading={gpsLoading}
          onPress={onActivateGps}
        />
      )}

      {statusLabel ? (
        <Text
          className="text-kemix-muted"
          style={{ fontFamily: APP_FONT.regular, fontSize: 13 }}
        >
          {facilityLabel} · {statusLabel}
          {nightPriorityActive ? ' · 심야약국 우선' : ''}
          {typeof resultCount === 'number' ? ` · ${resultCount}곳` : ''}
        </Text>
      ) : null}

      <RegionPickerModal
        visible={picker === 'sido'}
        title="시·도 선택"
        options={sidoOptions}
        selected={sido}
        onSelect={onSidoChange}
        onClose={() => setPicker(null)}
      />
      <RegionPickerModal
        visible={picker === 'sigungu'}
        title="시·군·구 선택"
        options={['전체', ...sigunguOptions]}
        selected={sigungu || '전체'}
        onSelect={(value) => onSigunguChange(value === '전체' ? '' : value)}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}
