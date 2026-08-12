import { useCallback, useState } from 'react';
import { LayoutAnimation, Platform, UIManager, View } from 'react-native';
import { EmsCommunityContent } from '@/components/emsCommunity/EmsCommunityContent';
import { EmsCommunitySegmentBar } from '@/components/emsCommunity/EmsCommunitySegmentBar';
import { ThemedScreen } from '@/components/theme/ThemedScreen';
import type { EmsCommunitySegment } from '@/constants/emsCommunity';
import { LocalCommunityTalkScreen } from '@/screens/utilities/LocalCommunityTalkScreen';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function EmsCommunityHub() {
  const [segment, setSegment] = useState<EmsCommunitySegment>('localTalk');

  const handleSegmentChange = useCallback((next: EmsCommunitySegment) => {
    if (next === segment) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSegment(next);
  }, [segment]);

  return (
    <ThemedScreen>
      <EmsCommunitySegmentBar value={segment} onChange={handleSegmentChange} />
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
