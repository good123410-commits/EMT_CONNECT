import { View } from 'react-native';
import { LocationRescue } from '@/components/util/LocationRescue';
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader';

type HomeLocationSectionProps = {
  refreshKey?: number;
};

export function HomeLocationSection({ refreshKey = 0 }: HomeLocationSectionProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <HomeSectionHeader
        title="실시간 내 위치"
        subtitle="현재 주소와 좌표를 확인하고 필요할 때 새로고침하세요"
      />
      <LocationRescue key={refreshKey} variant="home" showSmsButton={false} />
    </View>
  );
}
