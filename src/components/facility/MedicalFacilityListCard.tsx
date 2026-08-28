import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DistanceText } from '@/components/map/DistanceText';
import { StatusPill, type StatusPillTone } from '@/components/ui/StatusPill';
import {
  getMedicalListCardClass,
  MEDICAL_LIST_DISTANCE_ICON,
  MEDICAL_LIST_DISTANCE_TEXT,
  type MedicalListCardVariant,
} from '@/components/facility/medicalListCardStyles';
import type { DistanceUnitMode } from '@/utils/formatDistance';

type MedicalFacilityListCardProps = {
  selected?: boolean;
  variant?: MedicalListCardVariant;
  onPress: () => void;
  children: ReactNode;
};

export function MedicalFacilityListCard({
  selected = false,
  variant = 'default',
  onPress,
  children,
}: MedicalFacilityListCardProps) {
  return (
    <Pressable
      className={getMedicalListCardClass(variant, selected)}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

type MedicalFacilityListTitleRowProps = {
  title: string;
  trailing?: ReactNode;
};

export function MedicalFacilityListTitleRow({ title, trailing }: MedicalFacilityListTitleRowProps) {
  return (
    <View className="flex-row items-start justify-between">
      <Text className="flex-1 pr-2 text-base font-bold text-kemix-text" numberOfLines={2}>
        {title}
      </Text>
      {trailing ? <View className="flex-row flex-shrink-0 items-center gap-1.5">{trailing}</View> : null}
    </View>
  );
}

type MedicalFacilityStatusPillProps = {
  label: string;
  tone?: StatusPillTone;
};

export function MedicalFacilityStatusPill({
  label,
  tone = 'neutral',
}: MedicalFacilityStatusPillProps) {
  return <StatusPill label={label} tone={tone} />;
}

type MedicalFacilityListDistanceRowProps = {
  distanceM: number;
  walkMin?: number;
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitModeChange: (mode: DistanceUnitMode) => void;
  hint?: string;
  trailing?: ReactNode;
};

export function MedicalFacilityListDistanceRow({
  distanceM,
  walkMin = 0,
  distanceUnitMode,
  onDistanceUnitModeChange,
  hint,
  trailing,
}: MedicalFacilityListDistanceRowProps) {
  return (
    <View className="mt-3 flex-row items-center gap-3">
      {distanceM > 0 ? (
        <View className="flex-row items-center">
          <Ionicons name="walk-outline" size={14} color={MEDICAL_LIST_DISTANCE_ICON} />
          <DistanceText
            distanceM={distanceM}
            walkMin={walkMin}
            unitMode={distanceUnitMode}
            onUnitModeChange={onDistanceUnitModeChange}
            textStyle={MEDICAL_LIST_DISTANCE_TEXT}
          />
        </View>
      ) : hint ? (
        <Text className="text-xs text-kemix-muted">{hint}</Text>
      ) : null}
      {trailing}
    </View>
  );
}
