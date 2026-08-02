// DISABLED: 비상연락망 & 응급카드 (ICE) — 기능 일시 비활성화

export function EmergencyInfoCardContent() { return null; }

/*
﻿import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { EmergencyPublicCard } from '@/components/utilities/EmergencyPublicCard';
import { EmergencyQrCard } from '@/components/utilities/EmergencyQrCard';
import type { EmergencyContactCardData } from '@/types/emergencyContactCard';

type EmergencyInfoCardContentProps = {
  data: EmergencyContactCardData;
  variant?: 'default' | 'wallpaper';
  mode?: 'full' | 'public';
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
  mode = 'full',
}: EmergencyInfoCardContentProps) {
  if (mode === 'public') {
    return <EmergencyPublicCard data={data} variant={variant === 'wallpaper' ? 'dark' : 'dark'} />;
  }

  const light = variant === 'wallpaper';
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
            <Text className="text-[10px] font-bold text-white">앱 전용 미리보기</Text>
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

        <View
          className={`mt-4 items-center rounded-xl border p-4 ${
            light ? 'border-red-700 bg-red-950' : 'border-kemix-border-light bg-kemix-bg'
          }`}
        >
          <Text
            className={`mb-3 text-center text-xs font-semibold ${
              light ? 'text-red-100' : 'text-kemix-text-secondary'
            }`}
          >
            잠금화면·숏컷에는 아래 QR만 표시됩니다
          </Text>
          <EmergencyQrCard data={data} size={160} variant={light ? 'dark' : 'light'} />
        </View>
      </View>
    </View>
  );
}

*/
