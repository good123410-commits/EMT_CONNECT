// DISABLED: 비상연락망 & 응급카드 (ICE) — 기능 일시 비활성화

export function EmergencyQuickViewOverlay() { return null; }

/*
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyPublicCard } from '@/components/utilities/EmergencyPublicCard';
import type { EmergencyContactCardData } from '@/types/emergencyContactCard';

type EmergencyQuickViewOverlayProps = {
  visible: boolean;
  data: EmergencyContactCardData;
  mode?: 'quick' | 'wallpaper';
  onClose: () => void;
};

export function EmergencyQuickViewOverlay({
  visible,
  data,
  mode = 'quick',
  onClose,
}: EmergencyQuickViewOverlayProps) {
  const isWallpaper = mode === 'wallpaper';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View className={`flex-1 ${isWallpaper ? 'bg-red-950' : 'bg-slate-950'}`}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-bold text-white">
                {isWallpaper ? '배경화면용 응급 QR' : '응급 QR · 비상 연락망'}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-400">
                {isWallpaper
                  ? '스크린샷 후 잠금화면 배경으로 설정하세요 (개인정보 미노출)'
                  : '잠금화면 숏컷 · 위젯용 공개 화면'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pb-8"
            showsVerticalScrollIndicator={false}
          >
            <EmergencyPublicCard data={data} variant="dark" />

            {isWallpaper ? (
              <View className="mt-4 rounded-xl border border-red-800/80 bg-red-950/70 p-3">
                <Text className="text-xs font-bold text-red-100">배경화면 저장 방법</Text>
                <Text className="mt-2 text-[11px] leading-4 text-red-200">
                  1. 이 화면을 스크린샷으로 저장 → 2. 갤러리에서 이미지 선택 → 3. 잠금화면
                  배경으로 설정
                </Text>
              </View>
            ) : (
              <View className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <Text className="text-xs font-bold text-white">구급대원 안내</Text>
                <Text className="mt-2 text-[11px] leading-4 text-slate-300">
                  QR을 스캔하면 웹에서 비상 연락처·알레르기·복용 약물 등 응급 정보가 표시됩니다.
                  이 화면에는 민감한 정보가 노출되지 않습니다.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

*/
