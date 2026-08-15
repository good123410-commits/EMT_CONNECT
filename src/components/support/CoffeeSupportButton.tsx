import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CoffeeSupportModal } from '@/components/support/CoffeeSupportModal';
import { useAppConfig } from '@/contexts/AppConfigContext';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { openKakaoTalkPayLink } from '@/utils/kakaoTalkPayLink';

type CoffeeSupportButtonProps = {
  iconColor?: string;
  pressedBackgroundColor?: string;
};

/** 글로벌 헤더 우측 커피 후원 버튼 */
export function CoffeeSupportButton({
  iconColor,
  pressedBackgroundColor,
}: CoffeeSupportButtonProps) {
  const { navHeader } = useAppTheme();
  const { kakaoTalkPayLink } = useAppConfig();
  const [modalVisible, setModalVisible] = useState(false);

  const handleConfirm = () => {
    setModalVisible(false);
    void openKakaoTalkPayLink(kakaoTalkPayLink);
  };

  return (
    <>
      <View style={styles.container}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="커피 후원"
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [
            styles.button,
            pressed && {
              backgroundColor: pressedBackgroundColor ?? navHeader.pressed,
            },
          ]}
          hitSlop={6}
        >
          <Text style={[styles.icon, { color: iconColor ?? navHeader.icon }]}>☕</Text>
        </Pressable>
      </View>

      <CoffeeSupportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    lineHeight: 24,
  },
});
