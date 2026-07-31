import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GuideAdminCodeModal } from '@/components/guides/GuideAdminCodeModal';
import { KemiGuideSection } from '@/components/guides/KemiGuideSection';
import { APP_COLORS } from '@/constants/appTheme';

const ADMIN_CODE_TAP_WINDOW_MS = 900;

export function EmergencyGuideScreen() {
  const insets = useSafeAreaInsets();
  const [adminCodeModalVisible, setAdminCodeModalVisible] = useState(false);
  const adminTapCountRef = useRef(0);
  const adminTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHeaderSecretTap = () => {
    adminTapCountRef.current += 1;

    if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);
    adminTapTimerRef.current = setTimeout(() => {
      adminTapCountRef.current = 0;
    }, ADMIN_CODE_TAP_WINDOW_MS);

    if (adminTapCountRef.current >= 3) {
      adminTapCountRef.current = 0;
      if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);
      setAdminCodeModalVisible(true);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: APP_COLORS.background }}>
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          top: insets.top,
          right: 0,
          width: 48,
          height: 48,
          zIndex: 20,
        }}
        onPress={handleHeaderSecretTap}
      />
      <SafeAreaView edges={['top']} className="flex-1">
        <KemiGuideSection />
      </SafeAreaView>

      <GuideAdminCodeModal
        visible={adminCodeModalVisible}
        onClose={() => setAdminCodeModalVisible(false)}
      />
    </View>
  );
}
