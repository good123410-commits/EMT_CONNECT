import { Text, View } from 'react-native';

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  action?: string;
};

export function SectionTitle({ title, subtitle, action }: SectionTitleProps) {
  return (
    <View className="mb-4 flex-row items-end justify-between">
      <View className="flex-1 pr-3">
        <Text
          className="text-kemix-headline text-kemix-text"
          style={{ fontFamily: 'Pretendard-SemiBold' }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="mt-0.5 text-[13px] leading-5 text-kemix-text-secondary"
            style={{ fontFamily: 'Pretendard' }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Text
          className="text-[11px] text-kemix-text-muted"
          style={{ fontFamily: 'Pretendard-Medium' }}
        >
          {action}
        </Text>
      ) : null}
    </View>
  );
}
