import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { EmergencyContactCardData } from '@/types/emergencyContactCard';
import { buildEmergencyCardPayload } from '@/utils/emergencyCardEncoding';

type EmergencyInfoCardContentProps = {
  data: EmergencyContactCardData;
  variant?: 'default' | 'wallpaper';
  showQr?: boolean;
};

function ContactRow({
  label,
  name,
  phone,
  light,
}: {
  label: string;
  name: string;
  phone: string;
  light?: boolean;
}) {
  if (!name.trim() && !phone.trim()) return null;
  const titleColor = light ? 'text-white' : 'text-kemix-text';
  const subColor = light ? 'text-red-100' : 'text-kemix-text-secondary';
  const labelColor = light ? 'text-red-200' : 'text-red-600';
  return (
    <View className="mb-3">
      <Text className={`text-[10px] font-bold uppercase tracking-wide ${labelColor}`}>{label}</Text>
      <Text className={`mt-0.5 text-base font-bold ${titleColor}`}>
        {name.trim() || '—'}
      </Text>
      {phone.trim() ? (
        <View className="mt-1 flex-row items-center">
          <Ionicons name="call" size={14} color={light ? '#fecaca' : '#dc2626'} />
          <Text className={`ml-1.5 text-sm font-semibold ${subColor}`}>{phone.trim()}</Text>
        </View>
      ) : null}
    </View>
  );
}

function NoteBlock({
  label,
  value,
  light,
}: {
  label: string;
  value: string;
  light?: boolean;
}) {
  if (!value.trim()) return null;
  const labelColor = light ? 'text-red-200' : 'text-kemix-text-secondary';
  const textColor = light ? 'text-white' : 'text-kemix-text';
  return (
    <View className="mb-3">
      <Text className={`text-[10px] font-bold uppercase tracking-wide ${labelColor}`}>{label}</Text>
      <Text className={`mt-1 text-sm leading-5 ${textColor}`}>{value.trim()}</Text>
    </View>
  );
}

export function EmergencyInfoCardContent({
  data,
  variant = 'default',
  showQr = true,
}: EmergencyInfoCardContentProps) {
  const light = variant === 'wallpaper';
  const payload = buildEmergencyCardPayload(data);
  const border = light ? 'border-red-400' : 'border-red-200';
  const headerBg = light ? 'bg-red-700' : 'bg-red-600';
  const bodyBg = light ? 'bg-red-900' : 'bg-kemix-surface';

  return (
    <View className={`overflow-hidden rounded-2xl border-2 ${border}`}>
      <View className={`${headerBg} px-4 py-3`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="medical" size={22} color="#fff" />
            <Text className="ml-2 text-base font-bold text-white">응급 의료 정보 카드</Text>
          </View>
          <View className="rounded-full bg-kemix-surface/20 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-white">EMERGENCY</Text>
          </View>
        </View>
        {data.fullName.trim() ? (
          <Text className="mt-2 text-lg font-bold text-white">{data.fullName.trim()}</Text>
        ) : null}
      </View>

      <View className={`${bodyBg} p-4`}>
        <ContactRow
          label="비상 연락 1"
          name={data.contact1Name}
          phone={data.contact1Phone}
          light={light}
        />
        <ContactRow
          label="비상 연락 2"
          name={data.contact2Name}
          phone={data.contact2Phone}
          light={light}
        />
        <NoteBlock
          label="알레르기 · 복용 약물"
          value={data.allergiesMedications}
          light={light}
        />
        <NoteBlock label="선호 응급 병원" value={data.preferredHospital} light={light} />
        <NoteBlock label="응급 의료 메모" value={data.medicalNotes} light={light} />

        {showQr ? (
          <View
            className={`mt-2 flex-row items-start rounded-xl border p-3 ${
              light ? 'border-red-700 bg-red-950' : 'border-kemix-border-light bg-kemix-bg'
            }`}
          >
            <View
              className={`h-20 w-20 items-center justify-center rounded-lg ${
                light ? 'bg-kemix-surface' : 'bg-kemix-surface'
              }`}
            >
              <Ionicons name="qr-code" size={56} color="#0f172a" />
            </View>
            <View className="ml-3 flex-1">
              <Text
                className={`text-[10px] font-bold uppercase tracking-wide ${
                  light ? 'text-red-200' : 'text-kemix-text-secondary'
                }`}
              >
                응급 QR 데이터
              </Text>
              <Text
                className={`mt-1 text-[10px] leading-4 ${light ? 'text-red-100' : 'text-kemix-text-secondary'}`}
                numberOfLines={6}
              >
                {payload}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
