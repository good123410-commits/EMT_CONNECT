import { memo } from 'react';
import { View } from 'react-native';

function SkeletonBlock({ className }: { className?: string }) {
  return <View className={`rounded-lg bg-slate-200/80 ${className ?? ''}`} />;
}

function SkeletonCard() {
  return (
    <View className="mb-3 rounded-2xl border border-slate-100 bg-white p-4">
      <View className="flex-row justify-between">
        <SkeletonBlock className="h-4 flex-1 mr-8" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </View>
      <SkeletonBlock className="mt-3 h-3 w-full" />
      <SkeletonBlock className="mt-2 h-3 w-[85%]" />
      <SkeletonBlock className="mt-3 h-2.5 w-24" />
    </View>
  );
}

export const QuestionListSkeleton = memo(function QuestionListSkeleton({
  count = 6,
}: {
  count?: number;
}) {
  return (
    <View className="pt-1">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
});
