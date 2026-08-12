import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  resultCount: number;
};

export function MoonlightHospitalSearchBar({ value, onChangeText, resultCount }: Props) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center rounded-xl border border-kemix-border bg-white px-3">
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          className="ml-2 flex-1 py-3 text-sm text-kemix-text"
          placeholder="병원 이름 또는 주소 검색"
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="달빛어린이병원 검색"
        />
        {value.length > 0 ? (
          <Pressable
            onPress={() => onChangeText('')}
            accessibilityRole="button"
            accessibilityLabel="검색어 지우기"
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>

      <View className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
        <Text className="text-xs font-semibold text-indigo-900">
          🌙 전국 달빛어린이병원 {resultCount}곳 · 로컬 데이터 즉시 표시
        </Text>
        <Text className="mt-0.5 text-[11px] text-indigo-700">
          진료시간은 방문 전 전화 확인을 권장합니다
        </Text>
      </View>
    </View>
  );
}
