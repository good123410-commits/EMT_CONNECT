import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import type { PrivateEmsCall } from '@/lib/supabaseClient';
import {
  getLocationWithRegion,
  getLocationWithRegionImmediate,
  subscribeToLocationUpdates,
  type LocationSnapshot,
} from '@/services/locationService';
import {
  fetchMyEmsCalls,
  getCallStatusLabel,
  requestPrivateEmsCall,
} from '@/services/privateEmsCallService';
import { getRoleLabel } from '@/utils/roleAccess';

export function PrivateEmsCallScreen() {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [myCalls, setMyCalls] = useState<PrivateEmsCall[]>([]);
  const [regionLabel, setRegionLabel] = useState(() => {
    const snap = getLocationWithRegionImmediate();
    return snap.permissionGranted
      ? `${snap.region.label} · GPS 기준`
      : `${snap.region.label} · 기본 위치`;
  });

  const loadMyCalls = useCallback(async () => {
    if (!user) return;
    const calls = await fetchMyEmsCalls(user.id);
    setMyCalls(calls);
  }, [user]);

  useEffect(() => {
    void loadMyCalls();
    return subscribeToLocationUpdates((snapshot: LocationSnapshot) => {
      setRegionLabel(
        snapshot.permissionGranted
          ? `${snapshot.region.label} · GPS 기준`
          : `${snapshot.region.label} · 기본 위치`,
      );
    });
  }, [loadMyCalls]);

  const handleRequest = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { coordinate, region, permissionGranted } = await getLocationWithRegion();
      if (!permissionGranted) {
        Alert.alert('위치 권한 필요', '사설 구급차 호출을 위해 위치 접근을 허용해 주세요.');
        return;
      }

      await requestPrivateEmsCall({
        requesterId: user.id,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: region.label,
        notes: notes.trim() || undefined,
      });

      setNotes('');
      await loadMyCalls();
      Alert.alert(
        '호출 접수',
        '사설 구급차 호출이 접수되었습니다. 운용자 대시보드에 즉시 전달됩니다.',
      );
    } catch (e) {
      Alert.alert('호출 실패', e instanceof Error ? e.message : '다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-3">
        <Text className="text-xl font-bold text-slate-900">사설 구급차 호출</Text>
        <View className="mt-1 flex-row items-center">
          <Ionicons name="location" size={14} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-500">{regionLabel}</Text>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4 pb-24">
        <View className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <View className="flex-row items-center">
            <Ionicons name="warning" size={20} color="#dc2626" />
            <Text className="ml-2 text-sm font-bold text-red-800">응급 상황 안내</Text>
          </View>
          <Text className="mt-2 text-sm leading-5 text-red-700">
            생명이 위험한 응급 상황이라면 119에 먼저 신고하세요. 사설 구급차는 비응급 이송 및
            전원 목적으로 이용됩니다.
          </Text>
        </View>

        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-base font-bold text-slate-900">호출 요청</Text>
          <Text className="mt-1 text-sm text-slate-500">현재 GPS 위치가 자동으로 전달됩니다.</Text>

          <Text className="mb-1 mt-4 text-sm font-medium text-slate-700">추가 메모 (선택)</Text>
          <TextInput
            className="min-h-[80px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base"
            placeholder="환자 상태, 목적지 등"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          <Pressable
            className={`mt-4 items-center rounded-xl py-4 ${loading ? 'bg-slate-400' : 'bg-red-600'}`}
            onPress={handleRequest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="call" size={20} color="#fff" />
                <Text className="ml-2 text-base font-bold text-white">사설 구급차 호출</Text>
              </View>
            )}
          </Pressable>
        </View>

        {myCalls.length > 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="mb-3 text-base font-bold text-slate-900">내 호출 이력</Text>
            {myCalls.map((call) => (
              <View key={call.id} className="mb-2 rounded-xl bg-slate-50 p-3">
                <Text className="text-sm font-semibold text-slate-800">
                  {getCallStatusLabel(call.status)}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  {call.address ?? `${call.latitude}, ${call.longitude}`}
                </Text>
                <Text className="text-xs text-slate-400">
                  {new Date(call.created_at).toLocaleString('ko-KR')}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

export function PendingApprovalScreen({ onBack }: { onBack?: () => void }) {
  const { profile, signOut, refreshProfile } = useAuth();
  const { role } = useUserRole();
  const [refreshing, setRefreshing] = useState(false);

  useHardwareBackHandler(() => {
    if (onBack) {
      onBack();
      return true;
    }
    return false;
  }, Boolean(onBack));

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <Ionicons name="hourglass-outline" size={40} color="#d97706" />
          </View>
          <Text className="text-center text-2xl font-bold text-slate-900">승인 대기 중</Text>
          <Text className="mt-3 text-center text-base leading-6 text-slate-600">
            관리자의 가입 승인을 대기 중입니다.{'\n'}
            {getRoleLabel(role)} 계정은 승인 후 전용 채널에 접근할 수 있습니다.
          </Text>
          {profile ? (
            <View className="mt-6 w-full rounded-2xl border border-slate-200 bg-white p-4">
              <Text className="text-sm text-slate-500">신청 정보</Text>
              <Text className="mt-1 text-base font-semibold text-slate-900">
                {profile.name ?? '이름 미입력'}
              </Text>
              <Text className="text-sm text-slate-600">{profile.email}</Text>
              <Text className="mt-1 text-xs text-slate-400">
                역할: {getRoleLabel(profile.role)}
                {profile.invitation_code ? ` · 코드: ${profile.invitation_code}` : ''}
              </Text>
            </View>
          ) : null}
        </View>

        <Pressable
          className={`mb-3 items-center rounded-xl py-4 ${refreshing ? 'bg-slate-400' : 'bg-slate-900'}`}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-bold text-white">승인 상태 새로고침</Text>
          )}
        </Pressable>
        {onBack ? (
          <Pressable className="mb-3 items-center rounded-xl border border-slate-300 py-4" onPress={onBack}>
            <Text className="font-semibold text-slate-700">일반 모드로 돌아가기</Text>
          </Pressable>
        ) : null}
        <Pressable className="mb-8 items-center rounded-xl border border-slate-300 py-4" onPress={signOut}>
          <Text className="font-semibold text-slate-700">로그아웃</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
