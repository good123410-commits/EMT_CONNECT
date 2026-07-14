import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ParamedicHeader } from '@/components/expert/ParamedicHeader';
import { useParamedicCommunity } from '@/contexts/ParamedicCommunityContext';
import { useHardwareBackHandler } from '@/hooks/useHardwareBackHandler';
import type { BambooMessage } from '@/data/paramedicMockData';

const QUICK_TAGS = ['ER상황', '현장후기', '전원', '장비', '노무', '팁'];

function MessageCard({ message, onLike }: { message: BambooMessage; onLike: (id: string) => void }) {
  return (
    <View
      className={`mb-3 rounded-2xl border p-4 ${message.isHot ? 'border-orange-300 bg-orange-50/50' : 'border-green-200 bg-white'}`}
    >
      {message.isHot ? (
        <View className="mb-2 flex-row items-center">
          <Text className="text-xs font-bold text-orange-600">🔥 HOT · 현장 긴급</Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="person" size={14} color="#15803d" />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-800">{message.anonymousLabel}</Text>
            <Text className="text-xs text-slate-400">{message.postedAt}</Text>
          </View>
        </View>
        <View className="rounded-full bg-green-50 px-2 py-0.5">
          <Text className="text-[10px] font-medium text-green-700">{message.region}</Text>
        </View>
      </View>

      <Text className="mt-3 text-sm leading-6 text-slate-800">{message.content}</Text>

      <View className="mt-3 flex-row flex-wrap gap-1.5">
        {message.tags.map((tag) => (
          <View key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5">
            <Text className="text-[10px] font-medium text-slate-600">#{tag}</Text>
          </View>
        ))}
      </View>

      <View className="mt-3 flex-row items-center border-t border-slate-100 pt-3">
        <Pressable className="flex-row items-center" onPress={() => onLike(message.id)}>
          <Ionicons name="heart-outline" size={16} color="#64748b" />
          <Text className="ml-1 text-xs text-slate-500">{message.likes}</Text>
        </Pressable>
        <Pressable className="ml-4 flex-row items-center">
          <Ionicons name="chatbubble-outline" size={16} color="#64748b" />
          <Text className="ml-1 text-xs text-slate-500">익명 댓글</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ParamedicBambooForestScreen() {
  const { bambooMessages, postBambooMessage, likeMessage } = useParamedicCommunity();
  const [composing, setComposing] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useHardwareBackHandler(() => {
    if (composing) {
      setComposing(false);
      return true;
    }
    return false;
  }, composing);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handlePost = () => {
    const trimmed = content.trim();
    if (trimmed.length < 5) {
      Alert.alert('내용 부족', '5자 이상 입력해 주세요.');
      return;
    }
    postBambooMessage(trimmed, selectedTags.length > 0 ? selectedTags : ['현장후기']);
    setContent('');
    setSelectedTags([]);
    setComposing(false);
    Alert.alert('등록 완료', '익명으로 게시되었습니다. 신원은 완전히 보호됩니다.');
  };

  return (
    <View className="flex-1 bg-green-50/30">
      <ParamedicHeader subtitle="비밀 대나무숲 · 익명 현장 소통" />

      <View className="border-b border-green-200 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold text-slate-900">🎋 비밀 대나무숲</Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              면허 인증 대원만 · ER 상황 · 현장 정보 실시간 공유
            </Text>
          </View>
          <Pressable
            className="rounded-xl bg-green-700 px-4 py-2"
            onPress={() => setComposing((v) => !v)}
          >
            <Text className="text-xs font-bold text-white">{composing ? '닫기' : '✍️ 글쓰기'}</Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {composing ? (
          <View className="border-b border-green-200 bg-white p-4">
            <Text className="mb-2 text-xs font-semibold text-slate-500">익명 게시 · 신원 비공개</Text>
            <TextInput
              className="min-h-[100px] rounded-xl border border-green-200 bg-green-50/50 px-3 py-2 text-sm"
              placeholder="병원 ER 상황, 현장 후기, 장비 팁 등을 자유롭게..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1 ${selectedTags.includes(tag) ? 'bg-green-700' : 'bg-slate-100'}`}
                >
                  <Text
                    className={`text-xs font-medium ${selectedTags.includes(tag) ? 'text-white' : 'text-slate-600'}`}
                  >
                    #{tag}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable className="mt-3 items-center rounded-xl bg-green-700 py-3" onPress={handlePost}>
              <Text className="font-bold text-white">익명으로 게시하기</Text>
            </Pressable>
          </View>
        ) : null}

        <FlatList
          data={bambooMessages}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pb-28"
          renderItem={({ item }) => <MessageCard message={item} onLike={likeMessage} />}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
