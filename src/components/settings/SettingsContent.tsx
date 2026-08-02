import { View } from 'react-native';
import {
  SettingsAttachedModals,
  SettingsScreenProvider,
  SettingsScrollBody,
} from '@/components/settings/settingsScreenModel';

type SettingsContentProps = {
  /** 하단 시트 등에서 FAB 여백 없이 콘텐츠만 렌더 */
  embedded?: boolean;
};

export function SettingsContent({ embedded = false }: SettingsContentProps) {
  return (
    <SettingsScreenProvider>
      <SettingsScrollBody embedded={embedded} />
      <SettingsAttachedModals />
    </SettingsScreenProvider>
  );
}

/** @deprecated 설정은 하단 시트 모달로 열립니다. */
export function SettingsScreen() {
  return (
    <View className="flex-1 bg-kemix-bg">
      <SettingsContent />
    </View>
  );
}
