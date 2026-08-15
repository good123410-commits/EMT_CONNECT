import { Modal, Pressable, Text, View } from 'react-native';
import { COFFEE_SUPPORT_THANKS_MESSAGE } from '@/constants/appSettings';
import { useAppTheme } from '@/contexts/AppThemeContext';

type CoffeeSupportModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function CoffeeSupportModal({ visible, onClose, onConfirm }: CoffeeSupportModalProps) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)' }}
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-sm rounded-2xl p-6"
          style={{ backgroundColor: colors.surface }}
          onPress={(event) => event.stopPropagation()}
        >
          <Text className="text-center text-4xl">☕</Text>
          <Text
            className="mt-4 text-center text-base leading-6"
            style={{ fontFamily: 'Pretendard-Medium', color: colors.textPrimary }}
          >
            {COFFEE_SUPPORT_THANKS_MESSAGE}
          </Text>
          <Pressable
            className="mt-6 items-center rounded-xl py-3.5 active:opacity-90"
            style={{ backgroundColor: colors.blue }}
            onPress={onConfirm}
          >
            <Text
              className="text-base"
              style={{ fontFamily: 'Pretendard-SemiBold', color: '#FFFFFF' }}
            >
              확인
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
