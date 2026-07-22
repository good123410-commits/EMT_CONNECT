import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { confirmPhoneCall } from '@/utils/confirmPhoneCall';
import type { EmergencyHospitalSpecs } from '@/utils/emergencyHospitalSpecs';
import { hasEmergencyHospitalSpecs } from '@/utils/emergencyHospitalSpecs';

type Props = {
  specs: EmergencyHospitalSpecs | null | undefined;
  hospitalName: string;
  compact?: boolean;
  showDutyContacts?: boolean;
};

const ICON_MAP: Record<
  EmergencyHospitalSpecs['equipment'][number]['icon'],
  keyof typeof Ionicons.glyphMap
> = {
  scan: 'scan-outline',
  magnet: 'body-outline',
  pulse: 'pulse-outline',
  car: 'car-outline',
  fitness: 'fitness-outline',
  baby: 'happy-outline',
};

function SpecBadge({
  label,
  available,
  icon,
  compact,
}: {
  label: string;
  available: boolean;
  icon: keyof typeof ICON_MAP;
  compact?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center rounded-xl border px-2.5 py-1.5 ${
        available
          ? 'border-blue-200 bg-blue-50'
          : 'border-slate-200 bg-slate-50 opacity-70'
      } ${compact ? 'min-w-[30%] flex-1' : 'min-w-[28%] flex-grow basis-[30%]'}`}
    >
      <Ionicons
        name={ICON_MAP[icon]}
        size={compact ? 14 : 16}
        color={available ? '#1d4ed8' : '#94a3b8'}
      />
      <View className="ml-1.5 flex-1">
        <Text
          className={`font-semibold ${compact ? 'text-[10px]' : 'text-xs'} ${
            available ? 'text-blue-800' : 'text-slate-500'
          }`}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-slate-500`}>
          {available ? '가용' : '불가'}
        </Text>
      </View>
    </View>
  );
}

function DutyCallButton({
  label,
  phone,
  hospitalName,
  tone,
}: {
  label: string;
  phone: string;
  hospitalName: string;
  tone: 'er' | 'pediatric';
}) {
  const toneClass =
    tone === 'er'
      ? 'border-red-300 bg-red-600'
      : 'border-pink-300 bg-pink-600';

  return (
    <Pressable
      className={`flex-1 flex-row items-center justify-center rounded-2xl border px-3 py-3 ${toneClass}`}
      onPress={() => confirmPhoneCall(hospitalName, phone)}
      accessibilityRole="button"
    >
      <Ionicons name="call" size={18} color="#ffffff" />
      <View className="ml-2 flex-1">
        <Text className="text-[10px] font-bold text-white/90">{label}</Text>
        <Text className="text-sm font-bold text-white">{phone}</Text>
      </View>
    </Pressable>
  );
}

export function ErDutyContactButtons({
  specs,
  hospitalName,
}: {
  specs: EmergencyHospitalSpecs | null | undefined;
  hospitalName: string;
}) {
  if (!specs?.dutyContacts.length) return null;

  return (
    <View className="mb-3 gap-2">
      <Text className="text-xs font-bold text-slate-700">긴급 직통 연락처</Text>
      <View className="flex-row gap-2">
        {specs.dutyContacts.map((contact) => (
          <DutyCallButton
            key={contact.key}
            label={contact.label}
            phone={contact.phone}
            hospitalName={hospitalName}
            tone={contact.key}
          />
        ))}
      </View>
    </View>
  );
}

export function ErHospitalSpecsPanel({
  specs,
  hospitalName,
  compact = false,
  showDutyContacts = true,
}: Props) {
  if (!hasEmergencyHospitalSpecs(specs) || !specs) return null;

  const availableEquipment = specs.equipment.filter((item) => item.available);
  const equipmentToShow = compact ? availableEquipment.slice(0, 4) : specs.equipment;
  const pediatricToShow = compact
    ? specs.pediatricEquipment.filter((item) => item.available)
    : specs.pediatricEquipment;

  return (
    <View className={compact ? 'mt-2' : 'mt-4'}>
      {!compact && showDutyContacts && specs.dutyContacts.length > 0 ? (
        <ErDutyContactButtons specs={specs} hospitalName={hospitalName} />
      ) : null}

      {equipmentToShow.length > 0 ? (
        <View className={compact ? 'mb-2' : 'mb-4'}>
          {!compact ? (
            <Text className="mb-2 text-xs font-bold text-slate-700">주요 장비 가용</Text>
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {equipmentToShow.map((item) => (
              <SpecBadge
                key={item.key}
                label={compact ? item.shortLabel : item.label}
                available={item.available}
                icon={item.icon}
                compact={compact}
              />
            ))}
          </View>
        </View>
      ) : null}

      {!compact && specs.icuBeds.length > 0 ? (
        <View className="mb-4">
          <Text className="mb-2 text-xs font-bold text-slate-700">중환자실·특수 병상</Text>
          <View className="flex-row flex-wrap gap-2">
            {specs.icuBeds.map((item) => (
              <View
                key={item.key}
                className="min-w-[28%] flex-grow basis-[30%] rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2"
              >
                <Text className="text-[10px] text-slate-500">{item.label}</Text>
                <Text className="text-sm font-bold text-slate-900">{item.count}병상</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {pediatricToShow.length > 0 ? (
        <View>
          {!compact ? (
            <Text className="mb-2 text-xs font-bold text-slate-700">소아 전용 장비</Text>
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {pediatricToShow.map((item) => (
              <SpecBadge
                key={item.key}
                label={compact ? item.shortLabel : item.label}
                available={item.available}
                icon={item.icon}
                compact={compact}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
