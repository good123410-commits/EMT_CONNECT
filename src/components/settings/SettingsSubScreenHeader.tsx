import { Text, View } from 'react-native';

type SettingsSubScreenHeaderProps = {
  title?: string;
  subtitle?: string;
};

/** 글로벌 헤더 아래 보조 설명 영역 */
export function SettingsSubScreenHeader({ title, subtitle }: SettingsSubScreenHeaderProps) {
  return (
    <View className="border-b border-kemix-border bg-kemix-surface px-4 pb-4 pt-2">
      {title ? <Text className="text-base font-bold text-kemix-text">{title}</Text> : null}
      {subtitle ? (
        <Text className={`text-sm text-kemix-text-secondary${title ? ' mt-1' : ''}`}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
