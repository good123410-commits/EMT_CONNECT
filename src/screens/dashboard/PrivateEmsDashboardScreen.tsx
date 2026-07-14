import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HiddenChannelPanel } from '@/components/channels/HiddenChannelPanel';
import { useAuth } from '@/contexts/AuthContext';
import type { PrivateEmsCall } from '@/lib/supabaseClient';
import {
  fetchDispatchCallList,
  getCallStatusLabel,
  subscribeToDispatchCalls,
  unsubscribeDispatchCalls,
  updateEmsCallStatus,
} from '@/services/privateEmsCallService';

export function PrivateEmsDashboardScreen() {
  const { user, profile } = useAuth();
  const [calls, setCalls] = useState<PrivateEmsCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleCount] = useState(3);
  const [activeVehicles] = useState(2);

  const loadCalls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDispatchCallList();
      setCalls(data);
    } catch (e) {
      Alert.alert('조회 실패', e instanceof Error ? e.message : '배차 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const channel = subscribeToDispatchCalls(setCalls);
    setLoading(false);
    return () => unsubscribeDispatchCalls(channel);
  }, []);

  const handleAccept = async (call: PrivateEmsCall) => {
    if (!user) return;
    try {
      await updateEmsCallStatus(call.id, 'accepted', user.id);
      await loadCalls();
    } catch (e) {
      Alert.alert('처리 실패', e instanceof Error ? e.message : '다시 시도해 주세요.');
    }
  };

  const handleStatusChange = async (call: PrivateEmsCall, status: 'in_progress' | 'completed') => {
    try {
      await updateEmsCallStatus(call.id, status, user?.id);
      await loadCalls();
    } catch (e) {
      Alert.alert('처리 실패', e instanceof Error ? e.message : '다시 시도해 주세요.');
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-orange-200 bg-orange-900 px-4 pb-4">
        <View className="flex-row items-center">
          <Ionicons name="car" size={24} color="#fdba74" />
          <Text className="ml-2 text-xl font-bold text-white">사설 구급차 운용</Text>
        </View>
        <Text className="mt-1 text-sm text-orange-200">
          {profile?.company_name ?? profile?.name ?? '운용사'} · 실시간 배차
        </Text>
      </SafeAreaView>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4 pb-24">
        <View className="rounded-2xl border border-orange-200 bg-white p-4">
          <Text className="text-base font-bold text-slate-900">차량 현황</Text>
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1 rounded-xl bg-orange-50 p-3">
              <Text className="text-xs text-orange-600">총 차량</Text>
              <Text className="mt-1 text-2xl font-bold text-orange-900">{vehicleCount}</Text>
            </View>
            <View className="flex-1 rounded-xl bg-green-50 p-3">
              <Text className="text-xs text-green-600">운행 중</Text>
              <Text className="mt-1 text-2xl font-bold text-green-900">{activeVehicles}</Text>
            </View>
            <View className="flex-1 rounded-xl bg-slate-50 p-3">
              <Text className="text-xs text-slate-600">대기</Text>
              <Text className="mt-1 text-2xl font-bold text-slate-900">
                {vehicleCount - activeVehicles}
              </Text>
            </View>
          </View>
        </View>

        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-900">실시간 배차 콜</Text>
            <Pressable onPress={() => void loadCalls()}>
              <Ionicons name="refresh" size={20} color="#64748b" />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color="#ea580c" />
          ) : (
            <FlatList
              data={calls}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text className="py-4 text-center text-sm text-slate-400">
                  현재 대기 중인 호출이 없습니다.
                </Text>
              }
              renderItem={({ item }) => (
                <View className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-slate-900">
                      {getCallStatusLabel(item.status)}
                    </Text>
                    <Text className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleTimeString('ko-KR')}
                    </Text>
                  </View>
                  <Text className="mt-1 text-sm text-slate-600">
                    {item.address ??
                      `위치: ${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`}
                  </Text>
                  {item.notes ? (
                    <Text className="mt-1 text-xs text-slate-500">{item.notes}</Text>
                  ) : null}
                  <View className="mt-2 flex-row gap-2">
                    {item.status === 'pending' ? (
                      <Pressable
                        className="rounded-lg bg-orange-600 px-3 py-1.5"
                        onPress={() => void handleAccept(item)}
                      >
                        <Text className="text-xs font-bold text-white">수락</Text>
                      </Pressable>
                    ) : null}
                    {item.status === 'accepted' ? (
                      <Pressable
                        className="rounded-lg bg-blue-600 px-3 py-1.5"
                        onPress={() => void handleStatusChange(item, 'in_progress')}
                      >
                        <Text className="text-xs font-bold text-white">출동</Text>
                      </Pressable>
                    ) : null}
                    {item.status === 'in_progress' ? (
                      <Pressable
                        className="rounded-lg bg-green-600 px-3 py-1.5"
                        onPress={() => void handleStatusChange(item, 'completed')}
                      >
                        <Text className="text-xs font-bold text-white">완료</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <HiddenChannelPanel accentColor="#ea580c" />
      </ScrollView>
    </View>
  );
}
