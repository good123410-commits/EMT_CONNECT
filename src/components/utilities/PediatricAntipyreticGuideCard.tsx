import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from 'react-native';
import { ANTIPYRETIC_GUIDE_ITEMS } from '@/utils/pediatricAntipyreticCalc';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function PediatricAntipyreticGuideCard() {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-sky-100 bg-sky-50">
      <Pressable
        className="flex-row items-center px-4 py-3.5 active:bg-sky-100/60"
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="핵심 복용 가이드"
        accessibilityHint={expanded ? '눌러서 접기' : '눌러서 펼치기'}
      >
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color="#0369a1"
        />
        <View className="ml-2 min-w-0 flex-1">
          <Text className="text-sm font-bold text-sky-950">📌 핵심 복용 가이드</Text>
          <Text className="mt-0.5 text-[11px] text-sky-700">
            {expanded ? '눌러서 접기' : '눌러서 펼치기'}
          </Text>
        </View>
      </Pressable>

      {expanded ? (
        <View className="border-t border-sky-100 px-4 pb-4 pt-3">
          <View className="gap-2.5">
            {ANTIPYRETIC_GUIDE_ITEMS.map((item) => (
              <View key={item.title} className="rounded-xl bg-white/80 px-3 py-2.5">
                <Text className="text-xs font-bold text-sky-900">{item.title}</Text>
                <Text className="mt-1 text-xs leading-5 text-sky-800">{item.body}</Text>
              </View>
            ))}
          </View>
          <Text className="mt-3 text-[11px] leading-5 text-sky-700">
            아세트아미노펜 시럽 32mg/mL, 이부·덱시부프로펜 시럽 20mg/mL 기준 참고 계산입니다. 실제
            투여 전 의료진·약사 상담이 필요합니다.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
