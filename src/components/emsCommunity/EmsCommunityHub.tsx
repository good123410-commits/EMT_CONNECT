import { useCallback, useState } from 'react';
import { LayoutAnimation, Platform, UIManager, View } from 'react-native';
import { EmsCommunityContent } from '@/components/emsCommunity/EmsCommunityContent';
import { EmsCommunitySegmentBar } from '@/components/emsCommunity/EmsCommunitySegmentBar';
import { ThemedScreen } from '@/components/theme/ThemedScreen';
import type { EmsCommunitySegment } from '@/constants/emsCommunity';
import { CommunityImmersiveProvider, useCommunityImmersive } from '@/contexts/CommunityImmersiveContext';
import { LocalCommunityTalkScreen } from '@/screens/utilities/LocalCommunityTalkScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function EmsCommunityHubBody() {
  const [segment, setSegment] = useState<EmsCommunitySegment>('localTalk');
  const { immersive } = useCommunityImmersive();

  const handleSegmentChange = useCallback(
    (next: EmsCommunitySegment) => {
      if (next === segment) return;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSegment(next);
    },
    [segment],
  );

  return (
    <ThemedScreen>
      {!immersive ? (
        <EmsCommunitySegmentBar value={segment} onChange={handleSegmentChange} />
      ) : null}
      <View className="flex-1">
        {segment === 'localTalk' ? (
          <LocalCommunityTalkScreen embedded key="local-talk" />
        ) : (
          <EmsCommunityContent key="ems-community" />
        )}
      </View>
    </ThemedScreen>
  );
}

export function EmsCommunityHub() {
  return (
    <CommunityImmersiveProvider>
      <EmsCommunityHubBody />
    </CommunityImmersiveProvider>
  );
}
