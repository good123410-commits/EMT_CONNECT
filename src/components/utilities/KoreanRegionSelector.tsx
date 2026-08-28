import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, LayoutAnimation, Platform, Text, UIManager, View } from 'react-native';
import { UtilitySelectField } from '@/components/utilities/UtilitySelectField';
import type { KoreanSigunguUnit } from '@/constants/koreanRegions';
import { getLocationWithRegion } from '@/services/locationService';
import {
  getRegionUnitByCode,
  getSigunguUnitsForSido,
  getSidoOptions,
  resolveRegionCodeFromLocation,
} from '@/utils/koreanRegionResolver';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type KoreanRegionSelectorProps = {
  selectedCode: string | null;
  onSelect: (code: string) => void;
  detecting?: boolean;
  onDetectStart?: () => void;
  onDetectEnd?: () => void;
};

export function KoreanRegionSelector({
  selectedCode,
  onSelect,
  detecting = false,
  onDetectStart,
  onDetectEnd,
}: KoreanRegionSelectorProps) {
  const selected = getRegionUnitByCode(selectedCode);
  const [sido, setSido] = useState(selected?.sido ?? getSidoOptions()[0] ?? '');
  const [expanded, setExpanded] = useState(false);

  const sigunguUnits = useMemo(() => getSigunguUnitsForSido(sido), [sido]);

  useEffect(() => {
    const unit = getRegionUnitByCode(selectedCode);
    if (unit && unit.sido !== sido) {
      setSido(unit.sido);
    }
  }, [selectedCode, sido]);

  const sigunguValue = useMemo(() => {
    if (selectedCode && sigunguUnits.some((unit) => unit.code === selectedCode)) {
      return selectedCode;
    }
    return sigunguUnits[0]?.code ?? null;
  }, [selectedCode, sigunguUnits]);

  const sidoOptions = useMemo(
    () => getSidoOptions().map((name) => ({ value: name, label: name })),
    [],
  );

  const sigunguOptions = useMemo(
    () =>
      sigunguUnits.map((unit) => ({
        value: unit.code,
        label: unit.displayName,
      })),
    [sigunguUnits],
  );

  const handleSidoChange = (nextSido: string) => {
    setSido(nextSido);
    const first = getSigunguUnitsForSido(nextSido)[0];
    if (first) onSelect(first.code);
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const handleDetectGps = async () => {
    onDetectStart?.();
    try {
      const snapshot = await getLocationWithRegion();
      const code = resolveRegionCodeFromLocation(snapshot.region);
      if (!code) {
        Alert.alert(
          '지역 감지 실패',
          'GPS로 시·군·구를 특정하지 못했습니다. 목록에서 직접 선택해 주세요.',
        );
        return;
      }
      const unit = getRegionUnitByCode(code);
      if (unit) setSido(unit.sido);
      onSelect(code);
      Alert.alert('지역 자동 설정', unit?.label ?? '현재 위치 기반으로 지역이 설정되었습니다.');
    } catch {
      Alert.alert('위치 오류', '위치 권한을 확인한 뒤 다시 시도해 주세요.');
    } finally {
      onDetectEnd?.();
    }
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-end gap-2">
        <Pressable
          className="flex-row items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 active:bg-sky-100"
          onPress={() => void handleDetectGps()}
          disabled={detecting}
        >
          {detecting ? (
            <ActivityIndicator size="small" color="#0284c7" />
          ) : (
            <Ionicons name="locate-outline" size={16} color="#0284c7" />
          )}
          <Text className="ml-1.5 text-xs font-semibold text-sky-700">GPS 자동 감지</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center rounded-full border border-kemix-border bg-kemix-surface px-3 py-1.5 active:bg-kemix-bg"
          onPress={toggleExpanded}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <Ionicons name="map-outline" size={16} color="#475569" />
          <Text className="ml-1.5 text-xs font-semibold text-kemix-text">지역 변경</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#64748b"
            style={{ marginLeft: 4 }}
          />
        </Pressable>
      </View>

      {expanded ? (
        <View className="mt-3 overflow-hidden rounded-2xl border border-kemix-border bg-kemix-surface p-4">
          <Text className="mb-3 text-sm font-semibold text-kemix-text">상세 지역 선택</Text>
          <UtilitySelectField
            label="시·도"
            options={sidoOptions}
            value={sido}
            onChange={handleSidoChange}
            hint="17개 시·도 중 선택"
          />
          <UtilitySelectField
            label="시·군·구"
            options={sigunguOptions}
            value={sigunguValue}
            onChange={onSelect}
            hint={`${sigunguUnits.length}개 시·군·구`}
          />
        </View>
      ) : null}
    </View>
  );
}

export function KoreanRegionTitle({ unit }: { unit: KoreanSigunguUnit }) {
  return (
    <View className="rounded-2xl border border-sky-100 bg-kemix-surface px-4 py-3.5">
      <View className="flex-row items-center">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-sky-50">
          <Ionicons name="location" size={18} color="#0284c7" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">
            우리 동네
          </Text>
          <Text className="mt-0.5 text-lg font-bold text-kemix-text">{unit.label}</Text>
        </View>
      </View>
    </View>
  );
}

/** @deprecated KoreanRegionTitle 사용 */
export function KoreanRegionBadge({ unit }: { unit: KoreanSigunguUnit }) {
  return <KoreanRegionTitle unit={unit} />;
}
