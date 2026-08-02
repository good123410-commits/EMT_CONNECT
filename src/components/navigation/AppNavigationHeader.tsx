import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import {
  APP_HEADER_BRAND_NAME,
  APP_NAV_HEADER_BODY_HEIGHT,
  APP_NAV_HEADER_COLORS,
} from '@/constants/navigationHeader';
import { useAppNavigationHeaderState } from '@/hooks/useAppNavigationHeader';
import { navigationRef } from '@/navigation/navigationRef';

const SIDE_CLUSTER_WIDTH = 96;

export function AppNavigationHeader() {
  const insets = useSafeAreaInsets();
  const { visible, title, showBack, onBack } = useAppNavigationHeaderState();

  if (!visible) {
    return null;
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: insets.top,
          backgroundColor: APP_NAV_HEADER_COLORS.background,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.leftCluster}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="뒤로 가기"
              onPress={handleBack}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
              hitSlop={8}
            >
              <AppIcon name="chevron-left" size={24} color={APP_NAV_HEADER_COLORS.icon} />
            </Pressable>
          ) : (
            <View style={styles.brandCluster}>
              <View style={styles.logoMark}>
                <AppIcon name="medical-bag" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.brandText} numberOfLines={1}>
                {APP_HEADER_BRAND_NAME}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightCluster} />
      </View>
    </View>
  );
}

export function useAppNavigationHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.top + APP_NAV_HEADER_BODY_HEIGHT;
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP_NAV_HEADER_COLORS.border,
    zIndex: 900,
  },
  row: {
    height: APP_NAV_HEADER_BODY_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  leftCluster: {
    width: SIDE_CLUSTER_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: APP_NAV_HEADER_COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 13,
    color: APP_NAV_HEADER_COLORS.brandText,
    letterSpacing: 0.3,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: APP_NAV_HEADER_COLORS.title,
    paddingHorizontal: 4,
  },
  rightCluster: {
    width: SIDE_CLUSTER_WIDTH,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
