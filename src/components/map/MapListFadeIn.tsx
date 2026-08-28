import { useEffect, useRef, type ReactNode } from 'react';
import { Animated } from 'react-native';
import { MedicalFacilityListSkeleton } from '@/components/map/MedicalFacilityListSkeleton';

type MapListFadeInProps = {
  loading: boolean;
  hasData: boolean;
  children: ReactNode;
  skeletonCount?: number;
};

/** 목록 데이터 준비 전 스켈레톤 → 로드 후 페이드인 */
export function MapListFadeIn({
  loading,
  hasData,
  children,
  skeletonCount = 6,
}: MapListFadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading && !hasData) {
      opacity.setValue(0);
      return;
    }

    if (hasData) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [hasData, loading, opacity]);

  if (loading && !hasData) {
    return <MedicalFacilityListSkeleton count={skeletonCount} />;
  }

  return (
    <Animated.View style={{ flex: 1, opacity }}>
      {children}
    </Animated.View>
  );
}
