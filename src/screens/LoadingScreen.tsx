import { ActivityIndicator, Text, View } from 'react-native';

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#0f172a" />
      <Text className="mt-3 text-sm text-slate-400">앱을 불러오는 중...</Text>
    </View>
  );
}
