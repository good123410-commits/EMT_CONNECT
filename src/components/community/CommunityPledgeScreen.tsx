import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COMMUNITY_PLEDGE_ITEMS,
  COMMUNITY_PLEDGE_TITLE,
  EMS_COMMUNITY_TAB_LABEL,
} from '@/constants/emsCommunity';

type CommunityPledgeScreenProps = {
  onAccept: () => Promise<boolean>;
  loading?: boolean;
};

export function CommunityPledgeScreen({ onAccept, loading }: CommunityPledgeScreenProps) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!checked || submitting) return;
    setSubmitting(true);
    try {
      await onAccept();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="px-6 pb-10 pt-6">
          <View className="mb-6 items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Ionicons name="document-text-outline" size={32} color="#15803d" />
            </View>
            <Text className="text-center text-xl font-bold text-slate-900">{COMMUNITY_PLEDGE_TITLE}</Text>
            <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
              {EMS_COMMUNITY_TAB_LABEL}는 승인된 1급 응급구조사 전용 폐쇄형 커뮤니티입니다.{'\n'}
              아래 서약에 동의해야 이용할 수 있습니다.
            </Text>
          </View>

          <View className="rounded-2xl border border-green-200 bg-white p-4">
            {COMMUNITY_PLEDGE_ITEMS.map((item, index) => (
              <View key={item} className={`flex-row ${index > 0 ? 'mt-4' : ''}`}>
                <Text className="mr-2 text-sm font-bold text-green-700">{index + 1}.</Text>
                <Text className="flex-1 text-sm leading-6 text-slate-700">{item}</Text>
              </View>
            ))}
          </View>

          <Pressable
            className="mt-6 flex-row items-start rounded-2xl border border-slate-200 bg-white p-4"
            onPress={() => setChecked((v) => !v)}
          >
            <View
              className={`mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                checked ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'
              }`}
            >
              {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
            </View>
            <Text className="flex-1 text-sm leading-6 text-slate-700">
              위 이용 서약서를 모두 읽었으며, 커뮤니티 운영 정책을 준수할 것에 동의합니다.
            </Text>
          </Pressable>

          <Pressable
            className={`mt-6 items-center rounded-2xl py-4 ${
              checked && !submitting ? 'bg-green-700' : 'bg-slate-300'
            }`}
            onPress={() => void handleAccept()}
            disabled={!checked || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-bold text-white">동의하고 커뮤니티 입장</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
