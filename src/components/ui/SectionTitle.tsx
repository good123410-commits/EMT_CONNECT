import { Text, View } from 'react-native';
import { APP_COLORS } from '@/constants/appTheme';

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
          className="text-kemix-headline"
          style={{ fontFamily: 'Pretendard-SemiBold', color: APP_COLORS.textPrimary }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="mt-0.5 text-[13px] leading-5"
            style={{ fontFamily: 'Pretendard', color: APP_COLORS.textSecondary }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Text
          className="text-[11px]"
          style={{ fontFamily: 'Pretendard-Medium', color: APP_COLORS.textMuted }}
        >
          {action}
        </Text>
      ) : null}
    </View>
  );
}
