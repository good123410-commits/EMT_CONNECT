import { Text, View } from 'react-native';

type Props = {
  compact?: boolean;
};

export function PartnerHospitalBadge({ compact = false }: Props) {
  return (
    <View className={`self-start rounded-full bg-amber-100 ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}>
      <Text className={`font-bold text-amber-800 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        ⭐ 제휴
      </Text>
    </View>
  );
}
