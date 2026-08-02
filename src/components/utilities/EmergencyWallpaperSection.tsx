// DISABLED: 비상연락망 & 응급카드 (ICE) — 기능 일시 비활성화

export function EmergencyWallpaperSection() { return null; }

/*
﻿import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type EmergencyWallpaperSectionProps = {
  onOpenWallpaperPreview: () => void;
};

export function EmergencyWallpaperSection({
  onOpenWallpaperPreview,
}: EmergencyWallpaperSectionProps) {
  return (
    <View className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <View className="flex-row items-center">
        <Ionicons name="image-outline" size={22} color="#be123c" />
        <Text className="ml-2 text-base font-bold text-rose-900">잠금화면 배경화면으로 저장</Text>
      </View>
      <Text className="mt-3 text-xs leading-5 text-rose-800">
        숏컷·위젯이 아닌 배경화면으로 응급 정보를 항상 표시하는 방법입니다. 고대비 응급 카드를
        미리보기 후 스크린샷으로 저장하세요.
      </Text>

      <View className="mt-3 rounded-xl border border-rose-100 bg-kemix-surface p-3">
        <Text className="text-[11px] leading-4 text-kemix-text-secondary">
          · iOS: 사진 앱에서 이미지 선택 → 공유 → 「배경화면으로 사용」 → 잠금화면 선택
        </Text>
        <Text className="mt-2 text-[11px] leading-4 text-kemix-text-secondary">
          · Android: 갤러리에서 이미지 → 더보기 → 「잠금화면 배경화면」 또는 「배경화면으로 설정」
        </Text>
      </View>

      <Pressable
        className="mt-4 flex-row items-center justify-center rounded-xl border-2 border-rose-600 bg-kemix-surface py-3.5 active:bg-rose-50"
        onPress={onOpenWallpaperPreview}
      >
        <Ionicons name="phone-portrait-outline" size={18} color="#be123c" />
        <Text className="ml-2 text-sm font-bold text-rose-700">배경화면용 카드 미리보기</Text>
      </Pressable>
    </View>
  );
}

*/
