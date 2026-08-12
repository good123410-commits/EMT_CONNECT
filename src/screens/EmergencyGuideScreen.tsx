import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { GuideAdminCodeModal } from '@/components/guides/GuideAdminCodeModal';
import { KemiGuideSection } from '@/components/guides/KemiGuideSection';
import { useAppNavigationHeaderHeight } from '@/components/navigation/AppNavigationHeader';
import { ThemedScreen } from '@/components/theme/ThemedScreen';

const ADMIN_CODE_TAP_WINDOW_MS = 900;

export function EmergencyGuideScreen() {
  const headerHeight = useAppNavigationHeaderHeight();
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
    <ThemedScreen>
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          top: headerHeight - 48,
          right: 0,
          width: 48,
          height: 48,
          zIndex: 20,
        }}
        onPress={handleHeaderSecretTap}
      />
      <View className="flex-1">
        <KemiGuideSection />
      </View>

      <GuideAdminCodeModal
        visible={adminCodeModalVisible}
        onClose={() => setAdminCodeModalVisible(false)}
      />
    </ThemedScreen>
  );
}
