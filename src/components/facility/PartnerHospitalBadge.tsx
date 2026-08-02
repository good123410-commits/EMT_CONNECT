import { Text, View } from 'react-native';

type Props = {
  compact?: boolean;
  appearance?: 'list' | 'detail';
};

export function PartnerHospitalBadge({ compact = false, appearance = 'list' }: Props) {
  const isList = appearance === 'list';

  return (
    <View
      className={`self-start rounded-full ${
        isList ? 'border border-amber-900/60 bg-amber-950/40' : 'bg-amber-100'
      } ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}
    >
      <Text
        className={`font-bold ${
          isList ? 'text-amber-300' : 'text-amber-800'
        } ${compact ? 'text-[10px]' : 'text-xs'}`}
      >
        ⭐ 제휴
      </Text>
    </View>
  );
}
