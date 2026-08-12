import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import {
  LoungeCard,
  LoungeMetaText,
} from '@/components/emsCommunity/loungeUi';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import {
  formatEmsRoomListTimestamp,
  type EmsChatRoom,
} from '@/services/emsChatRoomService';

type EmsChatRoomCardProps = {
  room: EmsChatRoom;
  onPress: () => void;
};

export function EmsChatRoomCard({ room, onPress }: EmsChatRoomCardProps) {
  const { lounge } = useEmsLoungeTheme();

  const categoryLabel = [room.category, room.region].filter(Boolean).join(' · ');
  const preview = room.lastMessagePreview ?? room.description ?? '아직 메시지가 없습니다.';

  return (
    <LoungeCard onPress={onPress} style={{ marginBottom: 0 }}>
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Pretendard-Bold',
              fontSize: 16,
              color: lounge.text,
            }}
          >
            {room.roomName}
          </Text>
          {categoryLabel ? (
            <Text
              className="mt-1"
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: 11,
                color: lounge.accent,
              }}
            >
              {categoryLabel}
            </Text>
          ) : null}
        </View>
        {room.lastMessageAt ? (
          <LoungeMetaText>{formatEmsRoomListTimestamp(room.lastMessageAt)}</LoungeMetaText>
        ) : null}
      </View>

      <Text
        className="mt-2"
        numberOfLines={2}
        style={{
          fontFamily: 'Pretendard',
          fontSize: 14,
          color: lounge.textSecondary,
        }}
      >
        {preview}
      </Text>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={14} color={lounge.textMuted} />
            <Text
              className="ml-1"
              style={{
                fontFamily: 'Pretendard',
                fontSize: 11,
                color: lounge.textMuted,
              }}
            >
              {room.participantCount}명
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="chatbubble-outline" size={14} color={lounge.textMuted} />
            <Text
              className="ml-1"
              style={{
                fontFamily: 'Pretendard',
                fontSize: 11,
                color: lounge.textMuted,
              }}
            >
              {room.messageCount}
            </Text>
          </View>
        </View>
        {room.creatorLabel ? (
          <Text
            style={{
              fontFamily: 'Pretendard',
              fontSize: 11,
              color: lounge.textMuted,
            }}
          >
            개설 {room.creatorLabel}
          </Text>
        ) : null}
      </View>
    </LoungeCard>
  );
}
