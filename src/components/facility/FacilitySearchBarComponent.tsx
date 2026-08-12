import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { FacilitySearchMode } from '@/hooks/useFacilitySearchMode';
import { getSidoOptions, getSigunguOptionsForSido } from '@/utils/regionOptions';

export type FacilitySearchBarComponentProps = {
  facilityLabel: 'AED' | '병원' | '약국' | '소아';
  mode: FacilitySearchMode;
  sido: string;
  sigungu: string;
  gpsLoading?: boolean;
  statusLabel?: string;
  resultCount?: number;
  onActivateGps: () => void;
  onSidoChange: (value: string) => void;
  onSigunguChange: (value: string) => void;
};

type PickerTarget = 'sido' | 'sigungu' | null;

function RegionPickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="max-h-[60%] rounded-t-3xl bg-kemix-surface" onPress={(e) => e.stopPropagation()}>
          <View className="border-b border-kemix-border-light px-4 py-3">
            <Text className="text-base font-bold text-kemix-text">{title}</Text>
          </View>
          <ScrollView className="max-h-80">
            {options.map((option) => {
              const active = selected === option;
              return (
                <Pressable
                  key={option}
                  className={`border-b border-slate-50 px-4 py-3.5 ${active ? 'bg-blue-50' : ''}`}
                  onPress={() => {
                    onSelect(option);
                    onClose();
                  }}
                >
                  <Text className={`text-sm ${active ? 'font-bold text-blue-700' : 'text-kemix-text'}`}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * AED · 병원 · 약국 공통 지역 선택 UI
 * - 시·도 / 시·군·구 드롭다운 즉시 조회
 * - GPS 버튼(선택)
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
}: FacilitySearchBarComponentProps) {
  const [picker, setPicker] = useState<PickerTarget>(null);

  const sidoOptions = useMemo(() => [...getSidoOptions()], []);
  const sigunguOptions = useMemo(
    () => (sido ? getSigunguOptionsForSido(sido) : []),
    [sido],
  );

  const gpsActive = mode === 'gps';

  return (
    <View className="gap-3">
      <View>
        <Text className="mb-2 text-xs font-semibold text-kemix-text-secondary">지역 선택</Text>
        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-surface px-3 py-3"
            onPress={() => setPicker('sido')}
          >
            <Text className={`text-sm ${sido ? 'text-kemix-text' : 'text-kemix-muted'}`}>
              {sido || '시·도'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-surface px-3 py-3"
            onPress={() => sido && setPicker('sigungu')}
            disabled={!sido}
          >
            <Text className={`text-sm ${sigungu ? 'text-kemix-text' : 'text-kemix-muted'}`}>
              {sigungu || '전체'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
          </Pressable>
        </View>
      </View>

      <Pressable
        className={`flex-row items-center justify-center rounded-xl border px-4 py-3 ${
          gpsActive ? 'border-red-200 bg-red-50' : 'border-kemix-border bg-kemix-surface'
        } ${gpsLoading ? 'opacity-80' : 'active:opacity-90'}`}
        onPress={onActivateGps}
        disabled={gpsLoading}
      >
        {gpsLoading ? (
          <ActivityIndicator color={gpsActive ? '#dc2626' : '#0f172a'} />
        ) : (
          <Ionicons name="navigate" size={18} color={gpsActive ? '#dc2626' : '#475569'} />
        )}
        <Text
          className={`ml-2 text-sm font-semibold ${gpsActive ? 'text-red-700' : 'text-kemix-text'}`}
        >
          {gpsLoading ? '위치 확인 중...' : '현재 위치 기준으로 보기'}
        </Text>
        {gpsActive ? (
          <View className="ml-2 rounded-full bg-red-100 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-red-700">ON</Text>
          </View>
        ) : null}
      </Pressable>

      {statusLabel ? (
        <Text className="text-xs text-kemix-muted">
          {facilityLabel} · {statusLabel}
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
