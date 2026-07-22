import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import {
  adminGetUserActivity,
  adminListUsers,
  adminSetUserBlocked,
  AdminServiceError,
} from '@/services/adminService';
import type { AdminUserActivity, AdminUserRow } from '@/types/admin';
import { getRoleLabel } from '@/utils/roleAccess';

export function AdminUsersPanel() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [activity, setActivity] = useState<AdminUserActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [blockTarget, setBlockTarget] = useState<AdminUserRow | null>(null);
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await adminListUsers(search.trim());
      setUsers(rows);
    } catch (error) {
      Alert.alert('조회 실패', error instanceof Error ? error.message : '유저 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openActivity = async (user: AdminUserRow) => {
    setSelected(user);
    setActivity(null);
    setActivityLoading(true);
    try {
      const data = await adminGetUserActivity(user.id);
      setActivity(data);
    } catch (error) {
      Alert.alert('조회 실패', error instanceof Error ? error.message : '활동 로그를 불러올 수 없습니다.');
    } finally {
      setActivityLoading(false);
    }
  };

  const handleBlockConfirm = async () => {
    if (!blockTarget) return;
    setBlockSubmitting(true);
    try {
      const nextBlocked = !blockTarget.is_blocked;
      await adminSetUserBlocked(
        blockTarget.id,
        nextBlocked,
        nextBlocked ? '관리자 대시보드 제재' : undefined,
      );
      setBlockTarget(null);
      await loadUsers();
      if (selected?.id === blockTarget.id) {
        setSelected({ ...blockTarget, is_blocked: nextBlocked });
      }
      Alert.alert('완료', nextBlocked ? '유저가 차단되었습니다.' : '차단이 해제되었습니다.');
    } catch (error) {
      const message =
        error instanceof AdminServiceError ? error.message : '처리에 실패했습니다.';
      Alert.alert('실패', message);
    } finally {
      setBlockSubmitting(false);
    }
  };

  return (
    <View className="flex-1">
      <View className="mb-3 flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          className="ml-2 flex-1 py-2.5 text-sm text-slate-900"
          placeholder="이름 · 이메일 검색"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => void loadUsers()}
          returnKeyType="search"
        />
        <Pressable className="rounded-lg bg-violet-100 px-3 py-1.5" onPress={() => void loadUsers()}>
          <Text className="text-xs font-bold text-violet-700">검색</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="items-center py-12">
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerClassName="pb-6"
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-slate-500">검색 결과가 없습니다.</Text>
          }
          renderItem={({ item }) => (
            <View className="mb-2 rounded-xl border border-slate-200 bg-white p-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-slate-900">{item.name ?? '(이름 없음)'}</Text>
                  <Text className="mt-0.5 text-xs text-slate-500">{item.email ?? '—'}</Text>
                  <View className="mt-2 flex-row flex-wrap gap-1.5">
                    <Badge label={getRoleLabel(item.role)} tone="slate" />
                    {item.is_approved ? <Badge label="승인" tone="green" /> : <Badge label="미승인" tone="amber" />}
                    {item.is_blocked ? <Badge label="차단" tone="red" /> : null}
                  </View>
                </View>
                <View className="gap-1.5">
                  <Pressable
                    className="rounded-lg bg-slate-100 px-2.5 py-1.5"
                    onPress={() => void openActivity(item)}
                  >
                    <Text className="text-[11px] font-bold text-slate-700">활동</Text>
                  </Pressable>
                  <Pressable
                    className={`rounded-lg px-2.5 py-1.5 ${item.is_blocked ? 'bg-green-100' : 'bg-red-100'}`}
                    onPress={() => setBlockTarget(item)}
                  >
                    <Text
                      className={`text-[11px] font-bold ${item.is_blocked ? 'text-green-700' : 'text-red-700'}`}
                    >
                      {item.is_blocked ? '해제' : '차단'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View className="flex-1 bg-slate-50">
          <View className="border-b border-slate-200 bg-white px-4 py-4">
            <Pressable onPress={() => setSelected(null)}>
              <Text className="font-semibold text-violet-700">← 닫기</Text>
            </Pressable>
            <Text className="mt-2 text-lg font-bold text-slate-900">{selected?.name ?? '활동 로그'}</Text>
            <Text className="text-xs text-slate-500">{selected?.email}</Text>
          </View>
          {activityLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#7c3aed" />
            </View>
          ) : (
            <FlatList
              data={[
                { key: 'questions', title: '질문', items: activity?.questions ?? [] },
                { key: 'posts', title: '게시글', items: activity?.posts ?? [] },
                { key: 'answers', title: '답변', items: activity?.answers ?? [] },
              ]}
              keyExtractor={(section) => section.key}
              contentContainerClassName="p-4 pb-10"
              renderItem={({ item: section }) => (
                <View className="mb-4">
                  <Text className="mb-2 text-xs font-bold uppercase text-slate-400">
                    {section.title} ({section.items.length})
                  </Text>
                  {section.items.length === 0 ? (
                    <Text className="text-sm text-slate-400">없음</Text>
                  ) : (
                    section.items.map((row) => (
                      <View
                        key={'id' in row ? row.id : String(row)}
                        className="mb-2 rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <Text className="text-sm font-medium text-slate-800">
                          {'title' in row ? row.title : 'question_id' in row ? `질문 ${row.question_id.slice(0, 8)}…` : '—'}
                        </Text>
                        <Text className="mt-1 text-[11px] text-slate-400">
                          {new Date(row.created_at).toLocaleString('ko-KR')}
                          {'status' in row ? ` · ${row.status}` : ''}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      <AdminConfirmModal
        visible={!!blockTarget}
        title={blockTarget?.is_blocked ? '차단 해제' : '유저 차단'}
        message={
          blockTarget?.is_blocked
            ? `${blockTarget.name ?? '해당 유저'}의 차단을 해제하시겠습니까?`
            : `${blockTarget?.name ?? '해당 유저'}를 차단하시겠습니까?\n차단된 유저는 서비스 이용이 제한될 수 있습니다.`
        }
        confirmLabel={blockTarget?.is_blocked ? '해제' : '차단'}
        destructive={!blockTarget?.is_blocked}
        loading={blockSubmitting}
        onConfirm={() => void handleBlockConfirm()}
        onCancel={() => setBlockTarget(null)}
      />
    </View>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: 'slate' | 'green' | 'amber' | 'red';
}) {
  const toneMap = {
    slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
    green: { bg: 'bg-green-100', text: 'text-green-700' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
    red: { bg: 'bg-red-100', text: 'text-red-700' },
  } as const;
  const styles = toneMap[tone];

  return (
    <View className={`rounded-full px-2 py-0.5 ${styles.bg}`}>
      <Text className={`text-[10px] font-bold ${styles.text}`}>{label}</Text>
    </View>
  );
}
