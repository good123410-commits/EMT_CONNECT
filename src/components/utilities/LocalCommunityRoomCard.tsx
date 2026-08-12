import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/contexts/AppThemeContext';
import {
  formatRoomListTimestamp,
} from '@/services/localCommunityChatService';
import {
  LOCAL_COMMUNITY_CATEGORY_LABELS,
  type LocalCommunityRoom,
} from '@/types/localCommunity';

type LocalCommunityRoomCardProps = {
  room: LocalCommunityRoom;
  onPress: () => void;
};

export function LocalCommunityRoomCard({ room, onPress }: LocalCommunityRoomCardProps) {
  const { colors } = useAppTheme();

  const categoryLabel = room.category ? LOCAL_COMMUNITY_CATEGORY_LABELS[room.category] : room.topic;
  const preview = room.lastMessagePreview ?? room.description ?? '아직 메시지가 없습니다.';

  return (
    <Pressable
      className="active:opacity-90"
      onPress={onPress}
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.surface,
        padding: 14,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text
            className="text-base font-bold"
            numberOfLines={1}
            style={{ color: colors.textPrimary }}
          >
            {room.title}
          </Text>
          {categoryLabel ? (
            <Text className="mt-1 text-[11px] font-semibold" style={{ color: colors.categoryAccent }}>
              {categoryLabel}
            </Text>
          ) : null}
        </View>
        {room.lastMessageAt ? (
          <Text className="text-[10px]" style={{ color: colors.metaText }}>
            {formatRoomListTimestamp(room.lastMessageAt)}
          </Text>
        ) : null}
      </View>

      <Text
        className="mt-2 text-sm"
        numberOfLines={2}
        style={{ color: colors.textSecondary }}
      >
        {preview}
      </Text>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
            <Text className="ml-1 text-[11px]" style={{ color: colors.metaText }}>
              {room.participantCount}명
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
            <Text className="ml-1 text-[11px]" style={{ color: colors.metaText }}>
              {room.messageCount}
            </Text>
          </View>
        </View>
        <Text className="text-[11px]" style={{ color: colors.metaText }}>
          개설 {room.creatorLabel}
        </Text>
      </View>
    </Pressable>
  );
}
