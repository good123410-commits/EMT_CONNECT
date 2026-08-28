import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useGlobalFabBottomInset } from '@/hooks/useGlobalFabInset';

export function BookmarkToast() {
  const { lastFeedback, clearFeedback } = useBookmarks();
  const fabBottomInset = useGlobalFabBottomInset();

  useEffect(() => {
    if (!lastFeedback) return;
    const timer = setTimeout(clearFeedback, 2200);
    return () => clearTimeout(timer);
  }, [lastFeedback, clearFeedback]);

  if (!lastFeedback) return null;

  return (
    <View
      pointerEvents="none"
      className="absolute left-4 right-4 z-50 items-center"
      style={{ bottom: fabBottomInset + 8 }}
    >
      <View className="rounded-full bg-slate-900 px-5 py-3" style={styles.shadow}>
        <Text className="text-sm font-semibold text-white">{lastFeedback}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});
