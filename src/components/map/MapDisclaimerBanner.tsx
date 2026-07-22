import { Text, View } from 'react-native';

export function MapDisclaimerBanner() {
  return (
    <View className="border-t border-amber-200 bg-amber-50 px-3 py-2">
      <Text className="text-center text-[11px] leading-4 text-amber-900">
        본 앱은 의학적 진단이나 조언을 대신할 수 없으며, 응급 상황 시 즉시 119에 신고하십시오.
      </Text>
    </View>
  );
}
