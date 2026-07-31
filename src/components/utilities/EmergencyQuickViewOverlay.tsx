import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmergencyInfoCardContent } from '@/components/utilities/EmergencyInfoCardContent';
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
      <View className={`flex-1 ${isWallpaper ? 'bg-red-950' : 'bg-slate-900/95'}`}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-1">
              <Text className="text-lg font-bold text-white">
                {isWallpaper ? '배경화면용 응급 카드' : '응급 QR 카드 · 비상 연락망'}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-300">
                {isWallpaper
                  ? '스크린샷 후 잠금화면 배경으로 설정하세요'
                  : '잠금화면 숏컷에서 즉시 열리는 화면 (Quick View)'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              className="h-10 w-10 items-center justify-center rounded-full bg-kemix-surface/10 active:bg-kemix-surface/20"
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
            <EmergencyInfoCardContent
              data={data}
              variant={isWallpaper ? 'wallpaper' : 'default'}
              showQr
            />

            {isWallpaper ? (
              <View className="mt-4 rounded-xl border border-red-800 bg-red-900/60 p-3">
                <Text className="text-xs font-bold text-red-100">배경화면 저장 방법</Text>
                <Text className="mt-2 text-[11px] leading-4 text-red-200">
                  1. 이 화면을 스크린샷으로 저장 → 2. 갤러리에서 이미지 선택 → 3. 잠금화면
                  배경으로 설정
                </Text>
              </View>
            ) : (
              <View className="mt-4 rounded-xl border border-white/10 bg-kemix-surface/5 p-3">
                <Text className="text-xs font-bold text-white">비상 연락망</Text>
                <Text className="mt-2 text-[11px] leading-4 text-slate-300">
                  응급 상황에서 이 화면을 통해 연락처와 의료 정보를 즉시 확인할 수 있습니다.
                  잠금화면 숏컷을 설정하면 앱 메인을 거치지 않고 이 화면이 열립니다.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
