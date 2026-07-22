import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ReportContentButton } from '@/components/community/ReportContentButton';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import type { JobPost } from '@/data/paramedicMockData';

function JobCard({ post }: { post: JobPost }) {
  const isSeek = post.type === 'seek';

  return (
    <View
      className={`mb-3 rounded-2xl border p-4 ${isSeek ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'}`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <View className="flex-row items-center gap-2">
            <View
              className={`rounded-full px-2 py-0.5 ${isSeek ? 'bg-blue-100' : post.isUrgent ? 'bg-red-100' : 'bg-green-100'}`}
            >
              <Text
                className={`text-[10px] font-bold ${isSeek ? 'text-blue-700' : post.isUrgent ? 'text-red-700' : 'text-green-700'}`}
              >
                {isSeek ? '구직' : post.isUrgent ? '긴급채용' : '구인'}
              </Text>
            </View>
            <Text className="text-xs text-slate-400">{post.postedAt}</Text>
          </View>
          <Text className="mt-2 text-base font-bold text-slate-900">{post.title}</Text>
          <Text className="mt-0.5 text-sm text-slate-600">{post.company}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
      </View>

      <View className="mt-3 gap-1.5">
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={14} color="#64748b" />
          <Text className="ml-1.5 text-xs text-slate-600">{post.location}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="cash-outline" size={14} color="#64748b" />
          <Text className="ml-1.5 text-xs font-semibold text-green-700">{post.salary}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color="#64748b" />
          <Text className="ml-1.5 text-xs text-slate-600">{post.schedule}</Text>
        </View>
      </View>

      <View className="mt-3 rounded-xl bg-slate-50 p-3">
        <Text className="text-xs leading-5 text-slate-600">{post.requirements}</Text>
      </View>
      <View className="mt-3 flex-row justify-end border-t border-slate-100 pt-2">
        <ReportContentButton contentId={post.id} contentType="job" preview={post.title} />
      </View>
    </View>
  );
}

export function ParamedicJobsScreen() {
  const { jobPosts, postJobSeek, loading, error } = useParamedicCommunity();
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [filter, setFilter] = useState<'all' | 'hire' | 'seek'>('all');

  const filtered = jobPosts.filter((p) => filter === 'all' || p.type === filter);

  useHardwareBackHandler(() => {
    if (showWriteForm) {
      setShowWriteForm(false);
      return true;
    }
    return false;
  }, showWriteForm);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 필요', '제목과 내용을 입력해 주세요.');
      return;
    }
    try {
      await postJobSeek(title.trim(), content.trim(), location.trim() || '전국');
      setTitle('');
      setLocation('');
      setContent('');
      setShowWriteForm(false);
      Alert.alert('등록 완료', '구직 글이 등록되었습니다.');
    } catch (err) {
      Alert.alert(
        '등록 실패',
        err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  };

  return (
    <View className="flex-1 bg-slate-100">
      <ParamedicHeader subtitle="구인구직 · 응급구조사 전용" />

      <View className="border-b border-slate-200 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-slate-900">전국 구인/구직 보드</Text>
          <Pressable
            className="flex-row items-center rounded-xl bg-green-700 px-4 py-2"
            onPress={() => setShowWriteForm(true)}
          >
            <Ionicons name="create-outline" size={14} color="#fff" />
            <Text className="ml-1 text-xs font-bold text-white">✍️ 글쓰기</Text>
          </Pressable>
        </View>
        <View className="mt-3 flex-row gap-2">
          {(['all', 'hire', 'seek'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 ${filter === f ? 'bg-green-700' : 'bg-slate-100'}`}
            >
              <Text className={`text-xs font-semibold ${filter === f ? 'text-white' : 'text-slate-600'}`}>
                {f === 'all' ? '전체' : f === 'hire' ? '구인' : '구직'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-28"
        ListHeaderComponent={
          error ? (
            <View className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#15803d" />
            </View>
          ) : (
          <View className="items-center py-16">
            <Ionicons name="briefcase-outline" size={48} color="#94a3b8" />
            <Text className="mt-4 text-base font-semibold text-slate-600">등록된 공고가 없습니다</Text>
          </View>
          )
        }
        renderItem={({ item }) => <JobCard post={item} />}
      />

      <Modal visible={showWriteForm} animationType="slide" transparent>
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable className="flex-1 bg-black/40" onPress={() => setShowWriteForm(false)} />
          <View className="max-h-[85%] rounded-t-3xl bg-white px-4 pb-8 pt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-900">구직 글쓰기</Text>
              <Pressable onPress={() => setShowWriteForm(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="mb-1 text-xs font-semibold text-slate-500">제목</Text>
              <TextInput
                className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
                placeholder="예: 119 경력 5년 · 야간 근무 희망"
                value={title}
                onChangeText={setTitle}
              />

              <Text className="mb-1 text-xs font-semibold text-slate-500">희망 지역</Text>
              <TextInput
                className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
                placeholder="예: 서울, 경기"
                value={location}
                onChangeText={setLocation}
              />

              <Text className="mb-1 text-xs font-semibold text-slate-500">이력 · 자기소개</Text>
              <TextInput
                className="mb-4 min-h-[120px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
                placeholder="면허, 경력, 희망 근무 조건 등을 작성해 주세요"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />

              <Pressable className="items-center rounded-xl bg-green-700 py-4" onPress={() => void handleSubmit()}>
                <Text className="font-bold text-white">구직 글 등록</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
