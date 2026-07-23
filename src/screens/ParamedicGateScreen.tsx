import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { CommunityPledgeScreen } from '@/components/community/CommunityPledgeScreen';
import { ServicePolicyModal } from '@/components/legal/ServicePolicyModal';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useCommunityPledge } from '@/hooks/useCommunityPledge';
import { useServicePolicyAcknowledgment } from '@/hooks/useServicePolicyAcknowledgment';
import { ParamedicTabNavigator } from '@/navigation/ParamedicTabNavigator';
import { EmsQaBoardScreen } from '@/screens/emsCommunity/EmsQaBoardScreen';
import { PendingApprovalScreen } from '@/screens/PrivateEmsCallScreen';

/**
 * EMS 커뮤니티 탭 — 질문 게시판(Q&A) 연동
 * - 게스트·회원: 질문 목록 열람 / 로그인 후 질문 작성
 * - 승인 구급대원·관리자: 서약 후 내부 커뮤니티 탭 + 질문 게시판 답변
 */
export function ParamedicGateScreen() {
  const { role, isApproved, canAccessParamedicChannel } = useUserRole();
  const {
    acknowledged: policyAcknowledged,
    loading: policyLoading,
    acceptPolicy,
  } = useServicePolicyAcknowledgment();
  const { accepted: pledgeAccepted, loading: pledgeLoading, acceptPledge } = useCommunityPledge();
  const [policySubmitting, setPolicySubmitting] = useState(false);

  const showPolicyGate = !policyLoading && !policyAcknowledged;

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

  if (role === 'paramedic' && !isApproved) {
    return <PendingApprovalScreen />;
  }

  return <EmsQaBoardScreen key="ems-qa-board" />;
}
