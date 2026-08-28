import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';

type CommunityAuthorActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
  variant?: 'lounge' | 'default';
};

export function CommunityAuthorActions({
  onEdit,
  onDelete,
  variant = 'lounge',
}: CommunityAuthorActionsProps) {
  const { lounge } = useEmsLoungeTheme();

  if (variant === 'default') {
    return (
      <View className="gap-2.5 border-t border-kemix-border pt-4">
        <Pressable
          className="flex-row items-center justify-center rounded-xl border border-kemix-border bg-kemix-bg py-3.5 active:opacity-80"
          onPress={onEdit}
        >
          <Ionicons name="create-outline" size={18} color="#334155" />
          <Text className="ml-2 text-sm font-bold text-kemix-text">수정하기</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center justify-center rounded-xl border border-red-200 bg-red-50 py-3.5 active:opacity-80"
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={18} color="#dc2626" />
          <Text className="ml-2 text-sm font-bold text-red-600">이 글 삭제하기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="border-t pt-3"
      style={{ borderTopColor: lounge.border, gap: 10 }}
    >
      <Pressable
        className="flex-row items-center justify-center rounded-xl border py-3.5 active:opacity-85"
        style={{ borderColor: lounge.border, backgroundColor: lounge.background }}
        onPress={onEdit}
      >
        <Ionicons name="create-outline" size={18} color={lounge.text} />
        <Text
          className="ml-2 text-sm font-bold"
          style={{ color: lounge.text, fontFamily: 'Pretendard-Bold' }}
        >
          수정하기
        </Text>
      </Pressable>
      <Pressable
        className="flex-row items-center justify-center rounded-xl border py-3.5 active:opacity-85"
        style={{ borderColor: '#fecaca', backgroundColor: lounge.errorBg }}
        onPress={onDelete}
      >
        <Ionicons name="trash-outline" size={18} color={lounge.error} />
        <Text
          className="ml-2 text-sm font-bold"
          style={{ color: lounge.error, fontFamily: 'Pretendard-Bold' }}
        >
          이 글 삭제하기
        </Text>
      </Pressable>
    </View>
  );
}
