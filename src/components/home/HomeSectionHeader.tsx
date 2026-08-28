import { Text, View } from 'react-native';
import { APP_FONT } from '@/constants/appTheme';

type HomeSectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export function HomeSectionHeader({ title, subtitle }: HomeSectionHeaderProps) {
  return (
    <View className="mb-3">
      <Text
        className="text-kemix-text"
        style={{ fontFamily: APP_FONT.bold, fontSize: 20, lineHeight: 28 }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          className="mt-0.5 text-kemix-text-secondary"
          style={{ fontFamily: APP_FONT.regular, fontSize: 13, lineHeight: 18 }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
