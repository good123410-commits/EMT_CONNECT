import { Ionicons } from '@expo/vector-icons';
import { navigateToAdminDashboard } from '@/navigation/settingsNavigation';
import { useCallback, useState } from 'react';
import { Pressable, Alert, Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsMenuOptional } from '@/contexts/SettingsMenuContext';
import { useUserRole } from '@/contexts/UserRoleContext';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsAdminPortalModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const settingsMenu = useSettingsMenuOptional();
  const { verifyOpsAdminCode } = useUserRole();
  const [code, setCode] = useState('');

  const dismissSettingsLayers = useCallback(() => {
    onClose();
    settingsMenu?.closeSettings();
  }, [onClose, settingsMenu]);

  const runAfterDismiss = useCallback(
    (action: () => void) => {
      dismissSettingsLayers();
      requestAnimationFrame(() => {
        action();
      });
    },
    [dismissSettingsLayers],
  );

  const handleVerify = () => {
    const ok = verifyOpsAdminCode(code);
    if (ok) {
      setCode('');
      runAfterDismiss(navigateToAdminDashboard);
      return;
    }
    Alert.alert('인증 실패', '관리자 비밀코드가 올바르지 않습니다.');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-kemix-bg" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between border-b border-kemix-border bg-kemix-surface px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-bold text-kemix-text">관리자 대시보드</Text>
            <Text className="mt-0.5 text-xs text-kemix-text-secondary">운영 관리자 인증</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10">
          <View className="rounded-2xl border border-kemix-border bg-kemix-surface p-5">
            <Text className="text-sm leading-6 text-kemix-text-secondary">
              운영 관리자 비밀코드를 입력하면 통합 관리자 대시보드로 바로 이동합니다.
              {'\n\n'}승인된 관리자 계정은 별도 코드 없이 설정에서 바로 입장할 수 있습니다.
            </Text>

            <TextInput
              className="mt-4 rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text"
              value={code}
              onChangeText={setCode}
              placeholder="관리자 비밀코드"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Pressable
              className="mt-4 items-center rounded-xl bg-violet-700 py-3.5 active:bg-violet-800"
              onPress={handleVerify}
            >
              <Text className="font-bold text-white">인증하고 대시보드 입장</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
