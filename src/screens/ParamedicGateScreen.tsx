import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommunityPledgeScreen } from '@/components/community/CommunityPledgeScreen';
import { ServicePolicyModal } from '@/components/legal/ServicePolicyModal';
import { ProVerificationPanel } from '@/components/rewards/ProVerificationPanel';
import {
  EMS_COMMUNITY_TAB_LABEL,
  PARAMEDIC_GUARD_MESSAGE,
  PARAMEDIC_GUARD_TITLE,
} from '@/constants/emsCommunity';
import { V1_HIDE_HOSPITAL_CHANNEL } from '@/constants/releaseFlags';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useCommunityPledge } from '@/hooks/useCommunityPledge';
import { useServicePolicyAcknowledgment } from '@/hooks/useServicePolicyAcknowledgment';
import { ParamedicTabNavigator } from '@/navigation/ParamedicTabNavigator';
import { PendingApprovalScreen } from '@/screens/PrivateEmsCallScreen';
import { UserQuestionsScreen } from '@/screens/questions/UserQuestionsScreen';
import { useAuth } from '@/contexts/AuthContext';

/**
 * EMS 커뮤니티 탭 진입 게이트
 * 1) 운영 정책·면책 확인 (최초 1회)
 * 2) 일반 유저 — 질문하기 / 내 질문 목록
 * 3) 승인 구급대원·관리자 — 커뮤니티 서약 + 답변함·소통방 탭
 */
export function ParamedicGateScreen() {
  const { user } = useAuth();
  const { role, isApproved, canAccessParamedicChannel } = useUserRole();
  const {
    acknowledged: policyAcknowledged,
    loading: policyLoading,
    acceptPolicy,
  } = useServicePolicyAcknowledgment();
  const { accepted: pledgeAccepted, loading: pledgeLoading, acceptPledge } = useCommunityPledge();
  const [guardModalVisible, setGuardModalVisible] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [policySubmitting, setPolicySubmitting] = useState(false);
  const modalShownRef = useRef(false);

  const showPolicyGate = !policyLoading && !policyAcknowledged;

  useFocusEffect(
    useCallback(() => {
      if (showPolicyGate) return undefined;

      if (canAccessParamedicChannel || user) {
        modalShownRef.current = false;
        setGuardModalVisible(false);
        return undefined;
      }

      if (!modalShownRef.current) {
        modalShownRef.current = true;
        setGuardModalVisible(true);
      }

      return undefined;
    }, [canAccessParamedicChannel, showPolicyGate, user]),
  );

  const handlePolicyAcknowledge = async () => {
    setPolicySubmitting(true);
    try {
      await acceptPolicy();
    } finally {
      setPolicySubmitting(false);
    }
  };

  if (policyLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  if (showPolicyGate) {
    return (
      <ServicePolicyModal
        visible
        requireAcknowledgment
        acknowledging={policySubmitting}
        onAcknowledge={handlePolicyAcknowledge}
        onClose={() => undefined}
      />
    );
  }

  if (canAccessParamedicChannel) {
    if (pledgeLoading) {
      return <CommunityPledgeScreen onAccept={acceptPledge} loading />;
    }
    if (!pledgeAccepted) {
      return <CommunityPledgeScreen onAccept={acceptPledge} />;
    }
    return <ParamedicTabNavigator key="ems-paramedic-tabs" />;
  }

  if (user) {
    return <UserQuestionsScreen key="ems-user-questions" />;
  }

  if (role === 'paramedic' && !isApproved) {
    return <PendingApprovalScreen />;
  }

  return (
    <>
      <ParamedicAccessDeniedScreen onApply={() => setApplyModalVisible(true)} />
      <ParamedicGuardModal
        visible={guardModalVisible}
        onClose={() => setGuardModalVisible(false)}
        onApply={() => {
          setGuardModalVisible(false);
          setApplyModalVisible(true);
        }}
      />
      <ParamedicApplyModal visible={applyModalVisible} onClose={() => setApplyModalVisible(false)} />
    </>
  );
}

type ParamedicGuardModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
};

function ParamedicGuardModal({ visible, onClose, onApply }: ParamedicGuardModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-md rounded-2xl bg-white p-5">
          <View className="mb-3 items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <Ionicons name="shield-checkmark-outline" size={28} color="#2563eb" />
            </View>
          </View>
          <Text className="text-center text-lg font-bold text-slate-900">{PARAMEDIC_GUARD_TITLE}</Text>
          <Text className="mt-3 text-center text-sm leading-6 text-slate-600">
            {PARAMEDIC_GUARD_MESSAGE}
          </Text>
          <Pressable className="mt-5 items-center rounded-xl bg-green-700 py-3.5" onPress={onApply}>
            <Text className="font-bold text-white">승인 신청하기</Text>
          </Pressable>
          <Pressable className="mt-3 items-center rounded-xl border border-slate-200 py-3" onPress={onClose}>
            <Text className="font-semibold text-slate-600">닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ParamedicApplyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <Text className="text-lg font-bold text-slate-900">면허 승인 신청</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>
        <ScrollView contentContainerClassName="p-4 pb-10">
          <Text className="mb-4 text-sm leading-6 text-slate-600">
            1급 응급구조사 자격증과 초대 코드를 제출하면 관리자가 검토합니다. 승인 완료 후{' '}
            {EMS_COMMUNITY_TAB_LABEL}에 입장할 수 있습니다.
          </Text>
          <ProVerificationPanel />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ParamedicAccessDeniedScreen({ onApply }: { onApply: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Ionicons name="shield-checkmark-outline" size={40} color="#2563eb" />
          </View>
          <Text className="text-center text-xl font-bold text-slate-900">{EMS_COMMUNITY_TAB_LABEL}</Text>
          <Text className="mt-4 text-center text-base leading-7 text-slate-600">
            {PARAMEDIC_GUARD_MESSAGE}
          </Text>
          <Pressable className="mt-8 w-full items-center rounded-2xl bg-green-700 py-4" onPress={onApply}>
            <Text className="font-bold text-white">승인 신청하기</Text>
          </Pressable>
          <View className="mt-6 w-full rounded-2xl border border-slate-200 bg-white p-4">
            <Text className="text-sm font-semibold text-slate-800">이용 안내</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-500">
              · 1급 응급구조사 면허 서류 제출 후 관리자 승인 필요{'\n'}
              · 승인 완료 계정만 케이스 스터디·소통창·자료실·구인구직 이용 가능{'\n'}
              · 일반 응급·의료 정보는 [지도]·[약물/화학] 탭에서 이용
            </Text>
          </View>
          {V1_HIDE_HOSPITAL_CHANNEL ? (
            <Text className="mt-6 text-center text-xs text-slate-400">
              병원 관계자 전용 기능은 v1 출시 범위에서 제외되었습니다.
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}
