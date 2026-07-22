import { Text, View } from 'react-native';

type Props = {
  compact?: boolean;
};

export function MoonlightHospitalBadge({ compact = false }: Props) {
  return (
    <View
      className={`self-start rounded-full bg-indigo-100 ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}
    >
      <Text className={`font-bold text-indigo-800 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        🌙 달빛어린이병원
      </Text>
    </View>
  );
}
