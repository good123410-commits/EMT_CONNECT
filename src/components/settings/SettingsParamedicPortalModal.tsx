import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmsAuthPanel } from '@/components/rewards/EmsAuthPanel';
import { EMS_COMMUNITY_TAB_LABEL } from '@/constants/emsCommunity';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import type { SettingsStackParamList } from '@/navigation/SettingsStackNavigator';
import { resolveEmsAuthStatus } from '@/utils/emsAuthStatus';

type SettingsNav = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsParamedicPortalModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SettingsNav>();
  const { user, profile, refreshProfile } = useAuth();
  const { canAccessParamedicChannel } = useUserRole();

  const handleOpenCommunity = () => {
    onClose();
    navigation.getParent()?.navigate('Paramedic');
  };

  const showVerifiedPortal =
    canAccessParamedicChannel ||
    resolveEmsAuthStatus(profile, null) === 'verified';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-kemix-bg" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between border-b border-kemix-border bg-kemix-surface px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-bold text-kemix-text">EMS 인증 · 전용 공간</Text>
            <Text className="mt-0.5 text-xs text-kemix-text-secondary">
              EMS 인증 · 전용 콘텐츠 · 커뮤니티
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10 gap-4">
          {!user ? (
            <View className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Text className="text-sm font-bold text-amber-900">로그인이 필요합니다</Text>
              <Text className="mt-2 text-sm leading-6 text-amber-800">
                EMS 인증 신청과 전용 공간 이용을 위해 먼저 로그인해 주세요.
              </Text>
            </View>
          ) : showVerifiedPortal ? (
            <View className="gap-3">
              <View className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <Text className="text-sm font-bold text-green-900">EMS 인증 완료</Text>
                <Text className="mt-1 text-xs leading-5 text-green-800">
                  전용 공간과 EMS 커뮤니티에 접근할 수 있습니다.
                </Text>
              </View>

              <Pressable
                className="flex-row items-center justify-between rounded-2xl border border-green-200 bg-green-700 px-4 py-3.5 active:bg-green-800"
                onPress={handleOpenCommunity}
              >
                <View className="flex-row items-center">
                  <Ionicons name="people-outline" size={20} color="#fff" />
                  <Text className="ml-2 font-bold text-white">{EMS_COMMUNITY_TAB_LABEL} 열기</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#bbf7d0" />
              </Pressable>
            </View>
          ) : (
            <EmsAuthPanel onVerified={() => void refreshProfile()} />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
