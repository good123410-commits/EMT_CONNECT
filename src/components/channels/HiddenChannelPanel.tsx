import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import type { HiddenPost, HiddenPostTargetRole } from '@/lib/supabaseClient';
import { createHiddenPost, fetchHiddenPosts } from '@/services/hiddenPostService';
import { getAllowedTargetRoles, getRoleLabel, getTargetRoleLabel, PARAMEDIC_SPACE_GATE_MESSAGE } from '@/utils/roleAccess';

type HiddenChannelPanelProps = {
  accentColor?: string;
};

export function HiddenChannelPanel({ accentColor = '#0f172a' }: HiddenChannelPanelProps) {
  const { user, profile } = useAuth();
  const { role, isApproved, canAccessHidden } = useUserRole();
  const [posts, setPosts] = useState<HiddenPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<HiddenPostTargetRole>('all');
  const [submitting, setSubmitting] = useState(false);

  const allowedTargets = getAllowedTargetRoles(role);

  const loadPosts = useCallback(async () => {
    if (!canAccessHidden) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchHiddenPosts(role, isApproved);
      setPosts(data);
    } catch (e) {
      Alert.alert('조회 실패', e instanceof Error ? e.message : '게시글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [role, isApproved, canAccessHidden]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await createHiddenPost(user.id, role, isApproved, targetRole, title, content);
      setTitle('');
      setContent('');
      setComposing(false);
      await loadPosts();
      Alert.alert('등록 완료', '비밀 게시글이 등록되었습니다.');
    } catch (e) {
      Alert.alert('등록 실패', e instanceof Error ? e.message : '다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canAccessHidden) {
    return (
      <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <Text className="text-base font-bold text-amber-800">히든 채널 접근 불가</Text>
        <Text className="mt-2 text-sm text-amber-700">{PARAMEDIC_SPACE_GATE_MESSAGE}</Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-bold text-slate-900">히든 채널</Text>
          <Text className="text-xs text-slate-500">
            {getRoleLabel(role)} · 승인된 채널만 표시됩니다
          </Text>
        </View>
        <Pressable
          className="flex-row items-center rounded-xl px-3 py-2"
          style={{ backgroundColor: accentColor }}
          onPress={() => setComposing((v) => !v)}
        >
          <Ionicons name={composing ? 'close' : 'create-outline'} size={16} color="#fff" />
          <Text className="ml-1 text-sm font-semibold text-white">
            {composing ? '닫기' : '글쓰기'}
          </Text>
        </Pressable>
      </View>

      {composing ? (
        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="mb-2 text-sm font-medium text-slate-700">채널 선택</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {allowedTargets.map((t) => (
              <Pressable
                key={t}
                className={`rounded-full px-3 py-1.5 ${targetRole === t ? 'bg-slate-900' : 'bg-slate-100'}`}
                onPress={() => setTargetRole(t)}
              >
                <Text
                  className={`text-xs font-medium ${targetRole === t ? 'text-white' : 'text-slate-600'}`}
                >
                  {getTargetRoleLabel(t)}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            className="mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base"
            placeholder="제목"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            className="mb-3 min-h-[80px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base"
            placeholder="내용"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
          <Pressable
            className={`items-center rounded-xl py-3 ${submitting ? 'bg-slate-400' : ''}`}
            style={submitting ? undefined : { backgroundColor: accentColor }}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-bold text-white">등록</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={accentColor} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View className="rounded-2xl border border-dashed border-slate-200 bg-white p-6">
              <Text className="text-center text-sm text-slate-400">아직 게시글이 없습니다.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {getTargetRoleLabel(item.target_role)}
                </Text>
                <Text className="text-xs text-slate-400">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </Text>
              </View>
              <Text className="text-base font-bold text-slate-900">{item.title}</Text>
              <Text className="mt-1 text-sm leading-5 text-slate-600">{item.content}</Text>
              <Text className="mt-2 text-xs text-slate-400">
                {item.author?.name ?? profile?.name ?? '익명'}
                {item.author?.company_name ? ` · ${item.author.company_name}` : ''}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
