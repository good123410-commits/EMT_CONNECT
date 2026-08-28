import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoffeeSupportButton } from '@/components/support/CoffeeSupportButton';
import { AppIcon } from '@/components/ui/AppIcon';
import {
  APP_HEADER_BRAND_NAME,
  APP_NAV_HEADER_BODY_HEIGHT,
} from '@/constants/navigationHeader';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAppNavigationHeaderState } from '@/hooks/useAppNavigationHeader';
import { navigateHomeFromHeader } from '@/navigation/goHome';
import { navigationRef } from '@/navigation/navigationRef';

const SIDE_CLUSTER_WIDTH = 96;

type KonBrandButtonProps = {
  compact?: boolean;
  onPress: () => void;
  brandColor: string;
  brandTextColor: string;
  pressedColor: string;
};

function KonBrandButton({
  compact = false,
  onPress,
  brandColor,
  brandTextColor,
  pressedColor,
}: KonBrandButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="홈으로 이동"
      onPress={onPress}
      style={({ pressed }) => [
        styles.brandCluster,
        compact && styles.brandClusterCompact,
        pressed && { backgroundColor: pressedColor, borderRadius: 10 },
      ]}
      hitSlop={4}
    >
      <View
        style={[
          styles.logoMark,
          compact && styles.logoMarkCompact,
          { backgroundColor: brandColor },
        ]}
      >
        <AppIcon name="medical-bag" size={compact ? 14 : 16} color="#FFFFFF" />
      </View>
      {!compact ? (
        <Text style={[styles.brandText, { color: brandTextColor }]} numberOfLines={1}>
          {APP_HEADER_BRAND_NAME}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function AppNavigationHeader() {
  const insets = useSafeAreaInsets();
  const { navHeader } = useAppTheme();
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

  const handleKonPress = () => {
    navigateHomeFromHeader();
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: insets.top,
          backgroundColor: navHeader.background,
          borderBottomColor: navHeader.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.leftCluster, showBack && styles.leftClusterWithBack]}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="뒤로 가기"
              onPress={handleBack}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && { backgroundColor: navHeader.pressed },
              ]}
              hitSlop={8}
            >
              <AppIcon name="chevron-left" size={24} color={navHeader.icon} />
            </Pressable>
          ) : null}
          <KonBrandButton
            compact={showBack}
            onPress={handleKonPress}
            brandColor={navHeader.brand}
            brandTextColor={navHeader.brandText}
            pressedColor={navHeader.pressed}
          />
        </View>

        <Text style={[styles.title, { color: navHeader.title }]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightCluster}>
          <CoffeeSupportButton />
        </View>
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
  leftClusterWithBack: {
    width: undefined,
    flexShrink: 0,
    maxWidth: 120,
    gap: 2,
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  brandClusterCompact: {
    gap: 0,
    paddingHorizontal: 0,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkCompact: {
    width: 24,
    height: 24,
    borderRadius: 7,
  },
  brandText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
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
});
