import { memo } from 'react';
import { View } from 'react-native';

function SkeletonBlock({ className }: { className?: string }) {
  return <View className={`rounded-lg bg-kemix-elevated/80 ${className ?? ''}`} />;
}

function SkeletonCard() {
  return (
    <View className="mb-3 rounded-2xl border border-kemix-border-light bg-kemix-surface p-4">
      <View className="flex-row items-center justify-between">
        <SkeletonBlock className="h-4 flex-1 mr-8" />
        <SkeletonBlock className="h-5 w-14 rounded-full" />
      </View>
      <SkeletonBlock className="mt-3 h-3 w-full" />
      <SkeletonBlock className="mt-2 h-3 w-[78%]" />
      <SkeletonBlock className="mt-3 h-2.5 w-28" />
    </View>
  );
}

export const MedicalFacilityListSkeleton = memo(function MedicalFacilityListSkeleton({
  count = 6,
}: {
  count?: number;
}) {
  return (
    <View className="px-4 pt-2">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
});
