import { CommunityPledgeScreen } from '@/components/community/CommunityPledgeScreen';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useCommunityPledge } from '@/hooks/useCommunityPledge';
import { ParamedicTabNavigator } from '@/navigation/ParamedicTabNavigator';
import { EmsQaBoardScreen } from '@/screens/emsCommunity/EmsQaBoardScreen';
import { PendingApprovalScreen } from '@/screens/PrivateEmsCallScreen';
import { isExpertRole } from '@/utils/roleAccess';
import { ParamedicCommunityProvider } from '@/contexts/ParamedicCommunityContext';

/** EMS 커뮤니티 세그먼트 — 질문함·전문가 라운지 등 기존 흐름 */
export function EmsCommunityContent() {
  const { role, isApproved, canAccessParamedicChannel } = useUserRole();
  const { accepted: pledgeAccepted, loading: pledgeLoading, acceptPledge } = useCommunityPledge();

  if (canAccessParamedicChannel) {
    if (pledgeLoading) {
      return <CommunityPledgeScreen onAccept={acceptPledge} loading />;
    }
    if (!pledgeAccepted) {
      return <CommunityPledgeScreen onAccept={acceptPledge} />;
    }
    return <ParamedicTabNavigator key="ems-paramedic-tabs" nestedAboveMainTabBar />;
  }

  if (isExpertRole(role) && !isApproved) {
    return <PendingApprovalScreen />;
  }

  return (
    <ParamedicCommunityProvider>
      <EmsQaBoardScreen key="ems-qa-board" />
    </ParamedicCommunityProvider>
  );
}
