import { Text, View } from 'react-native';

type Props = {
  compact?: boolean;
  appearance?: 'list' | 'detail';
};

export function MoonlightHospitalBadge({ compact = false, appearance = 'list' }: Props) {
  const isList = appearance === 'list';

  return (
    <View
      className={`self-start rounded-full ${
        isList ? 'border border-indigo-900/60 bg-indigo-950/40' : 'bg-indigo-100'
      } ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}
    >
      <Text
        className={`font-bold ${
          isList ? 'text-indigo-300' : 'text-indigo-800'
        } ${compact ? 'text-[10px]' : 'text-xs'}`}
      >
        🌙 달빛어린이병원
      </Text>
    </View>
  );
}
