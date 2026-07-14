import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { PrivateEmsHeader } from '@/components/expert/PrivateEmsHeader';
import { usePrivateEmsDispatch } from '@/contexts/PrivateEmsDispatchContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { formatFare } from '@/data/privateEmsMockData';
import { getRoleLabel } from '@/utils/roleAccess';

function StatusBadge({ status }: { status: 'accepted' | 'in_progress' | 'completed' }) {
  const config = {
    accepted: { label: '수락됨', bg: 'bg-orange-100', text: 'text-orange-700' },
    in_progress: { label: '운행 중', bg: 'bg-blue-100', text: 'text-blue-700' },
    completed: { label: '완료', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  }[status];

  return (
    <View className={`rounded-full px-2.5 py-0.5 ${config.bg}`}>
      <Text className={`text-xs font-bold ${config.text}`}>{config.label}</Text>
    </View>
  );
}

export function PrivateEmsMyControlScreen() {
  const { profile } = useAuth();
  const { role, isApproved, exitExpertMode } = useUserRole();
  const { acceptedDispatches, completeDispatch } = usePrivateEmsDispatch();

  const activeDispatches = acceptedDispatches.filter((d) => d.status !== 'completed');
  const completedDispatches = acceptedDispatches.filter((d) => d.status === 'completed');
  const totalEarnings = acceptedDispatches.reduce((sum, d) => sum + d.fare, 0);

  return (
    <View className="flex-1 bg-slate-100">
      <PrivateEmsHeader subtitle="내 관제 · 매칭 내역 및 정산" />

      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4 pb-28">
        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-sm font-bold text-slate-900">운용자 정보</Text>
          <View className="mt-3 flex-row items-center">
            <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-slate-900">
              <Text className="text-lg">🚑</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-900">
                {profile?.company_name ?? profile?.name ?? '운용사'}
              </Text>
              <Text className="text-sm text-slate-500">
                {getRoleLabel(role)} · {isApproved ? '승인 완료' : '승인 대기'}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <Text className="text-xs text-orange-600">오늘 수락</Text>
            <Text className="mt-1 text-2xl font-bold text-orange-900">{acceptedDispatches.length}건</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <Text className="text-xs text-emerald-600">예상 수익</Text>
            <Text className="mt-1 text-xl font-bold text-emerald-900">{formatFare(totalEarnings)}</Text>
          </View>
        </View>

        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-900">진행 중 매칭</Text>
            <Text className="text-xs text-slate-400">{activeDispatches.length}건</Text>
          </View>

          {activeDispatches.length === 0 ? (
            <View className="items-center py-6">
              <Ionicons name="document-text-outline" size={32} color="#cbd5e1" />
              <Text className="mt-2 text-sm text-slate-400">아직 수락한 콜이 없습니다</Text>
              <Text className="mt-1 text-xs text-slate-400">정기 콜보드에서 이송을 수락해 보세요</Text>
            </View>
          ) : (
            activeDispatches.map((dispatch) => (
              <View
                key={dispatch.id}
                className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="text-xs font-bold text-slate-500">
                      {dispatch.type === 'empty_return' ? '공차 복귀' : '정기 이송'}
                    </Text>
                    <View className="ml-2">
                      <StatusBadge status={dispatch.status} />
                    </View>
                  </View>
                  <Text className="text-xs text-slate-400">{dispatch.acceptedAt}</Text>
                </View>
                <Text className="mt-2 text-sm font-bold text-slate-900">
                  {dispatch.from} ➡️ {dispatch.to}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  {dispatch.patientInfo} · {dispatch.notes}
                </Text>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-orange-600">{formatFare(dispatch.fare)}</Text>
                  <Text className="text-xs text-slate-400">{dispatch.distance}</Text>
                </View>
                {dispatch.status === 'accepted' ? (
                  <Pressable
                    className="mt-2 items-center rounded-lg bg-emerald-600 py-2"
                    onPress={() => completeDispatch(dispatch.id)}
                  >
                    <Text className="text-xs font-bold text-white">운행 완료 처리</Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </View>

        {completedDispatches.length > 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="mb-3 text-base font-bold text-slate-900">완료 내역</Text>
            {completedDispatches.map((dispatch) => (
              <View key={dispatch.id} className="mb-2 flex-row items-center justify-between py-2">
                <View className="flex-1">
                  <Text className="text-sm text-slate-700">
                    {dispatch.from} → {dispatch.to}
                  </Text>
                  <Text className="text-xs text-slate-400">{dispatch.acceptedAt}</Text>
                </View>
                <Text className="text-sm font-semibold text-emerald-600">{formatFare(dispatch.fare)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="mb-3 text-base font-bold text-slate-900">설정</Text>
          <Pressable
            className="flex-row items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
            onPress={exitExpertMode}
          >
            <View className="flex-row items-center">
              <Ionicons name="arrow-back-outline" size={18} color="#64748b" />
              <Text className="ml-3 text-sm font-medium text-slate-700">일반 모드로 전환</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
