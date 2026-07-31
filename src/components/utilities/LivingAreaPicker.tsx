import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {
  LIVING_AREA_MACRO_REGIONS,
  LIVING_AREAS,
  type LivingArea,
  type LivingAreaMacroRegion,
  getLivingAreasByMacro,
} from '@/constants/livingAreas';

type LivingAreaPickerProps = {
  selectedId: string | null;
  onSelect: (areaId: string) => void;
};

export function LivingAreaPicker({ selectedId, onSelect }: LivingAreaPickerProps) {
  const [open, setOpen] = useState(false);
  const [macroFilter, setMacroFilter] = useState<LivingAreaMacroRegion | '전체'>('전체');

  const selected = LIVING_AREAS.find((area) => area.id === selectedId);
  const filteredAreas = useMemo(
    () => getLivingAreasByMacro(macroFilter),
    [macroFilter],
  );

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-semibold text-kemix-text">통합 생활권</Text>
      <Pressable
        accessibilityRole="button"
        className="flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-surface px-4 py-3.5 active:bg-kemix-bg"
        onPress={() => setOpen(true)}
      >
        <View className="flex-1 pr-2">
          <Text className={`text-base ${selected ? 'font-bold text-kemix-text' : 'text-kemix-muted'}`}>
            {selected?.name ?? '생활권을 선택하세요'}
          </Text>
          {selected ? (
            <Text className="mt-0.5 text-[11px] text-kemix-text-secondary">{selected.coverage}</Text>
          ) : null}
        </View>
        <Ionicons name="map-outline" size={20} color="#0284c7" />
      </Pressable>
      <Text className="mt-1.5 text-xs leading-5 text-kemix-muted">
        인접 지역을 묶은 {LIVING_AREAS.length}개 통합 생활권 단위로 피드를 분리합니다.
      </Text>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)}>
          <View className="flex-1 justify-end">
            <Pressable
              className="max-h-[85%] rounded-t-2xl bg-kemix-surface px-4 pb-6 pt-3"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-base font-bold text-kemix-text">생활권 선택</Text>
                <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-3"
                contentContainerClassName="gap-2"
              >
                <MacroChip
                  label="전체"
                  active={macroFilter === '전체'}
                  onPress={() => setMacroFilter('전체')}
                />
                {LIVING_AREA_MACRO_REGIONS.map((macro) => (
                  <MacroChip
                    key={macro}
                    label={macro}
                    active={macroFilter === macro}
                    onPress={() => setMacroFilter(macro)}
                  />
                ))}
              </ScrollView>

              <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
                {filteredAreas.map((area) => {
                  const active = area.id === selectedId;
                  return (
                    <Pressable
                      key={area.id}
                      className={`mb-2 rounded-xl border px-4 py-3 ${
                        active ? 'border-sky-300 bg-sky-50' : 'border-kemix-border bg-kemix-surface'
                      }`}
                      onPress={() => {
                        onSelect(area.id);
                        setOpen(false);
                      }}
                    >
                      <Text
                        className={`text-sm ${active ? 'font-bold text-sky-900' : 'text-kemix-text'}`}
                      >
                        {area.name}
                      </Text>
                      <Text className="mt-0.5 text-[11px] text-kemix-text-secondary">{area.coverage}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function MacroChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`rounded-full px-3 py-1.5 ${
        active ? 'bg-sky-600' : 'bg-kemix-elevated'
      }`}
      onPress={onPress}
    >
      <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-kemix-text-secondary'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function LivingAreaBadge({ area }: { area: LivingArea }) {
  return (
    <View className="flex-row items-center rounded-full bg-sky-50 px-2.5 py-1">
      <Ionicons name="location-outline" size={12} color="#0284c7" />
      <Text className="ml-1 text-[10px] font-semibold text-sky-800">{area.name}</Text>
    </View>
  );
}
