import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { EmsCommunityHub } from '@/components/emsCommunity/EmsCommunityHub';
import { ServicePolicyModal } from '@/components/legal/ServicePolicyModal';
import { useServicePolicyAcknowledgment } from '@/hooks/useServicePolicyAcknowledgment';

/**
 * EMS 커뮤니티 탭 — 우리동네토크 · EMS 커뮤니티 세그먼트
 * - 서비스 정책 동의 후 상단 세그먼트로 피드 전환
 */
export function ParamedicGateScreen() {
  const {
    acknowledged: policyAcknowledged,
    loading: policyLoading,
    acceptPolicy,
  } = useServicePolicyAcknowledgment();
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
      <View className="flex-1 items-center justify-center bg-kemix-bg">
        <ActivityIndicator size="large" color="#3B82F6" />
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

  return <EmsCommunityHub />;
}
