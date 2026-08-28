import { Ionicons } from '@expo/vector-icons';
import { Pressable, ActivityIndicator, Text, View } from 'react-native';
import { MedicineImage } from '@/components/medicine/MedicineImage';
import type { MedicineInfo } from '@/services/emergencyApi';

type Props = {
  item: MedicineInfo;
  onPress: () => void;
  isFavorite?: boolean;
  favoriteLoading?: boolean;
  onToggleFavorite?: () => void;
};

function stripText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function MedicineListCard({
  item,
  onPress,
  isFavorite = false,
  favoriteLoading = false,
  onToggleFavorite,
}: Props) {
  const summary = stripText(item.efficacy) || '효능 정보를 확인하려면 탭하세요';

  return (
    <Pressable
      className="flex-row rounded-2xl border border-kemix-border bg-kemix-surface p-3 active:bg-kemix-bg"
      onPress={onPress}
    >
      <MedicineImage uri={item.itemImage} size={80} />
      <View className="ml-3 flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="text-xs font-medium text-blue-600">{item.entpName || '의약품'}</Text>
            <Text className="mt-1 text-base font-bold text-kemix-text" numberOfLines={2}>
              {item.itemName?.trim() || '제품명 없음'}
            </Text>
          </View>
          {onToggleFavorite ? (
            <Pressable
              className="rounded-full p-1 active:opacity-80"
              hitSlop={10}
              disabled={favoriteLoading}
              onPress={(event) => {
                event.stopPropagation();
                onToggleFavorite();
              }}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              {favoriteLoading ? (
                <ActivityIndicator size="small" color="#FBBF24" />
              ) : (
                <Ionicons
                  name={isFavorite ? 'star' : 'star-outline'}
                  size={22}
                  color={isFavorite ? '#FBBF24' : '#94a3b8'}
                />
              )}
            </Pressable>
          ) : null}
        </View>
        <Text className="mt-1.5 text-sm leading-5 text-kemix-text-secondary" numberOfLines={2}>
          {summary}
        </Text>
        <View className="mt-2 flex-row items-center">
          <Ionicons name="document-text-outline" size={14} color="#64748b" />
          <Text className="ml-1 text-xs text-kemix-text-secondary">상세 · 복용법 · 주의사항</Text>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 'auto' }} />
        </View>
      </View>
    </Pressable>
  );
}
