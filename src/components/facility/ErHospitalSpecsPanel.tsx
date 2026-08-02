import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { MEDICAL_DETAIL } from '@/constants/medicalDetailTheme';
import { confirmPhoneCall } from '@/utils/confirmPhoneCall';
import type { EmergencyHospitalSpecs } from '@/utils/emergencyHospitalSpecs';
import { hasEmergencyHospitalSpecs } from '@/utils/emergencyHospitalSpecs';

type Props = {
  specs: EmergencyHospitalSpecs | null | undefined;
  hospitalName: string;
  compact?: boolean;
  showDutyContacts?: boolean;
  appearance?: 'default' | 'light';
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
  appearance = 'default',
}: {
  label: string;
  available: boolean;
  icon: keyof typeof ICON_MAP;
  compact?: boolean;
  appearance?: 'default' | 'light';
}) {
  const isLight = appearance === 'light';
  return (
    <View
      className={
        isLight
          ? undefined
          : `flex-row items-center rounded-xl border px-2.5 py-1.5 ${
              available
                ? 'border-blue-200 bg-blue-50'
                : 'border-kemix-border bg-kemix-bg opacity-70'
            } ${compact ? 'min-w-[30%] flex-1' : 'min-w-[28%] flex-grow basis-[30%]'}`
      }
      style={
        isLight
          ? {
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: available ? '#bfdbfe' : MEDICAL_DETAIL.border,
              backgroundColor: available ? '#eff6ff' : MEDICAL_DETAIL.card,
              opacity: available ? 1 : 0.85,
              paddingHorizontal: 10,
              paddingVertical: 6,
              minWidth: compact ? '30%' : '28%',
              flexGrow: 1,
              flexBasis: '30%',
            }
          : undefined
      }
    >
      <Ionicons
        name={ICON_MAP[icon]}
        size={compact ? 14 : 16}
        color={available ? '#1d4ed8' : '#94a3b8'}
      />
      <View className="ml-1.5 flex-1">
        <Text
          className={
            isLight
              ? undefined
              : `font-semibold ${compact ? 'text-[10px]' : 'text-xs'} ${
                  available ? 'text-blue-800' : 'text-kemix-text-secondary'
                }`
          }
          style={
            isLight
              ? {
                  fontWeight: '600',
                  fontSize: compact ? 10 : 12,
                  color: available ? '#1e40af' : MEDICAL_DETAIL.textSecondary,
                }
              : undefined
          }
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          className={isLight ? undefined : `${compact ? 'text-[9px]' : 'text-[10px]'} text-kemix-text-secondary`}
          style={
            isLight
              ? { fontSize: compact ? 9 : 10, color: MEDICAL_DETAIL.textMuted }
              : undefined
          }
        >
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
  appearance = 'default',
}: {
  specs: EmergencyHospitalSpecs | null | undefined;
  hospitalName: string;
  appearance?: 'default' | 'light';
}) {
  if (!specs?.dutyContacts.length) return null;
  const isLight = appearance === 'light';

  return (
    <View className="mb-3 gap-2">
      <Text
        className={isLight ? undefined : 'text-xs font-bold text-kemix-text'}
        style={isLight ? { fontSize: 12, fontWeight: '700', color: MEDICAL_DETAIL.text } : undefined}
      >
        긴급 직통 연락처
      </Text>
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
  appearance = 'default',
}: Props) {
  if (!hasEmergencyHospitalSpecs(specs) || !specs) return null;
  const isLight = appearance === 'light';

  const availableEquipment = specs.equipment.filter((item) => item.available);
  const equipmentToShow = compact ? availableEquipment.slice(0, 4) : specs.equipment;
  const pediatricToShow = compact
    ? specs.pediatricEquipment.filter((item) => item.available)
    : specs.pediatricEquipment;

  return (
    <View className={compact ? 'mt-2' : 'mt-4'}>
      {!compact && showDutyContacts && specs.dutyContacts.length > 0 ? (
        <ErDutyContactButtons specs={specs} hospitalName={hospitalName} appearance={appearance} />
      ) : null}

      {equipmentToShow.length > 0 ? (
        <View className={compact ? 'mb-2' : 'mb-4'}>
          {!compact ? (
            <Text
              className={isLight ? undefined : 'mb-2 text-xs font-bold text-kemix-text'}
              style={
                isLight
                  ? { marginBottom: 8, fontSize: 12, fontWeight: '700', color: MEDICAL_DETAIL.text }
                  : undefined
              }
            >
              주요 장비 가용
            </Text>
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {equipmentToShow.map((item) => (
              <SpecBadge
                key={item.key}
                label={compact ? item.shortLabel : item.label}
                available={item.available}
                icon={item.icon}
                compact={compact}
                appearance={appearance}
              />
            ))}
          </View>
        </View>
      ) : null}

      {!compact && specs.icuBeds.length > 0 ? (
        <View className="mb-4">
          <Text
            className={isLight ? undefined : 'mb-2 text-xs font-bold text-kemix-text'}
            style={
              isLight
                ? { marginBottom: 8, fontSize: 12, fontWeight: '700', color: MEDICAL_DETAIL.text }
                : undefined
            }
          >
            중환자실·특수 병상
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {specs.icuBeds.map((item) => (
              <View
                key={item.key}
                className={
                  isLight
                    ? undefined
                    : 'min-w-[28%] flex-grow basis-[30%] rounded-xl border border-kemix-border bg-kemix-bg px-2.5 py-2'
                }
                style={
                  isLight
                    ? {
                        minWidth: '28%',
                        flexGrow: 1,
                        flexBasis: '30%',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: MEDICAL_DETAIL.border,
                        backgroundColor: MEDICAL_DETAIL.card,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                      }
                    : undefined
                }
              >
                <Text
                  className={isLight ? undefined : 'text-[10px] text-kemix-text-secondary'}
                  style={isLight ? { fontSize: 10, color: MEDICAL_DETAIL.textSecondary } : undefined}
                >
                  {item.label}
                </Text>
                <Text
                  className={isLight ? undefined : 'text-sm font-bold text-kemix-text'}
                  style={
                    isLight ? { fontSize: 14, fontWeight: '700', color: MEDICAL_DETAIL.text } : undefined
                  }
                >
                  {item.count}병상
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {pediatricToShow.length > 0 ? (
        <View>
          {!compact ? (
            <Text
              className={isLight ? undefined : 'mb-2 text-xs font-bold text-kemix-text'}
              style={
                isLight
                  ? { marginBottom: 8, fontSize: 12, fontWeight: '700', color: MEDICAL_DETAIL.text }
                  : undefined
              }
            >
              소아 전용 장비
            </Text>
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {pediatricToShow.map((item) => (
              <SpecBadge
                key={item.key}
                label={compact ? item.shortLabel : item.label}
                available={item.available}
                icon={item.icon}
                compact={compact}
                appearance={appearance}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
