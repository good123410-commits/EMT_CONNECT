import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProVerificationPanel } from '@/components/rewards/ProVerificationPanel';
import { EMS_COMMUNITY_TAB_LABEL } from '@/constants/emsCommunity';
import { useAuth } from '@/contexts/AuthContext';
import { useExpertSettingsAccess } from '@/hooks/useExpertSettingsAccess';
import { useUserRole } from '@/contexts/UserRoleContext';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import type { SettingsStackParamList } from '@/navigation/SettingsStackNavigator';

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
  const { user } = useAuth();
  const { canAccessParamedicChannel } = useUserRole();
  const { canOpenAnswerInbox } = useExpertSettingsAccess();

  const handleOpenCommunity = () => {
    onClose();
    navigation.getParent()?.navigate('Paramedic');
  };

  const handleOpenAnswerInbox = () => {
    onClose();
    navigation.navigate('ParamedicAnswerInbox');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-bold text-slate-900">구급대원 인증 · 전용 공간</Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              1급 응급구조사 승인 · EMS 커뮤니티 · Q&A 답변함
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
                구급대원 인증 신청과 전용 공간 이용을 위해 먼저 로그인해 주세요.
              </Text>
            </View>
          ) : canAccessParamedicChannel ? (
            <View className="gap-3">
              <View className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <Text className="text-sm font-bold text-green-900">승인된 구급대원 계정</Text>
                <Text className="mt-1 text-xs leading-5 text-green-800">
                  EMS 커뮤니티와 전문가 기능에 접근할 수 있습니다.
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

              {canOpenAnswerInbox ? (
                <Pressable
                  className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 active:bg-slate-50"
                  onPress={handleOpenAnswerInbox}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="mail-unread-outline" size={20} color="#15803d" />
                    <Text className="ml-2 font-semibold text-slate-900">전문가 전용 답변함</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View className="rounded-2xl border border-slate-200 bg-white p-1">
              <ProVerificationPanel />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
