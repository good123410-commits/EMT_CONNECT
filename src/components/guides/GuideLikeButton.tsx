import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';

type GuideLikeButtonProps = {
  liked: boolean;
  count: number;
  loading?: boolean;
  onPress: () => void;
};

export function GuideLikeButton({ liked, count, loading, onPress }: GuideLikeButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.28,
        useNativeDriver: true,
        speed: 28,
        bounciness: 10,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 24,
        bounciness: 8,
      }),
    ]).start();
    onPress();
  };

  return (
    <Pressable
      className="flex-row items-center rounded-full border border-kemix-border-light bg-kemix-bg px-3 py-2 active:opacity-80"
      onPress={handlePress}
      disabled={loading}
      hitSlop={6}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {loading ? (
          <ActivityIndicator size="small" color="#ef4444" />
        ) : (
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={20}
            color={liked ? '#ef4444' : '#64748b'}
          />
        )}
      </Animated.View>
      <Text className={`ml-1.5 text-sm font-bold ${liked ? 'text-red-500' : 'text-kemix-text-secondary'}`}>
        {count}
      </Text>
    </Pressable>
  );
}
