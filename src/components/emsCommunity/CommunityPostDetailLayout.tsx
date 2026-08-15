import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { LoungeBackBar } from '@/components/emsCommunity/loungeUi';
import { EMS_LOUNGE_SPACING } from '@/constants/emsLoungeTheme';

type CommunityPostDetailLayoutProps = {
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
};

/** EMS 커뮤니티 상세 화면 공통 레이아웃 — 뒤로 가기 + 본문 */
export function CommunityPostDetailLayout({
  backLabel,
  onBack,
  children,
}: CommunityPostDetailLayoutProps) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <LoungeBackBar label={backLabel} onPress={onBack} />
      <View style={{ paddingHorizontal: EMS_LOUNGE_SPACING.screen }}>{children}</View>
    </ScrollView>
  );
}
