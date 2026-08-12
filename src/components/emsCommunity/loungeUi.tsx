import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, Text, TextInput, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EMS_LOUNGE_SHADOW, EMS_LOUNGE_SPACING, useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { DRAGGABLE_FAB_SIZE } from '@/constants/fabLayout';
import { getExpertTabBarMetrics } from '@/navigation/expertTabBarOptions';
import { useParamedicTabLayout } from '@/navigation/paramedicTabLayout';
import { useShowGlobalMoreFab } from '@/hooks/useRootRoute';

export function LoungeScreen({ children }: { children: ReactNode }) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <View className="flex-1 bg-kemix-bg" style={{ backgroundColor: lounge.background }}>
      {children}
    </View>
  );
}

/** 상단 액션·필터 영역 — 배경 없이 본문과 연속 */
export function LoungeTopSection({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        paddingHorizontal: EMS_LOUNGE_SPACING.screen,
        paddingTop: EMS_LOUNGE_SPACING.screenTop,
        paddingBottom: EMS_LOUNGE_SPACING.headerBottom,
      }}
    >
      {children}
    </View>
  );
}

/** 가로 스크롤 필터 칩 행 */
export function LoungeFilterRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 4 }}
    >
      {children}
    </ScrollView>
  );
}

export function LoungeCard({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const { lounge } = useEmsLoungeTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: lounge.surface,
    borderRadius: 16,
    padding: EMS_LOUNGE_SPACING.cardPadding,
    marginBottom: EMS_LOUNGE_SPACING.cardGap,
    borderWidth: 1,
    borderColor: lounge.border,
    ...EMS_LOUNGE_SHADOW.cardSoft,
    ...style,
  };

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  // Web: Pressable renders <button> — avoid nesting interactive children (like, tags).
  if (Platform.OS === 'web') {
    return (
      <View
        style={[cardStyle, { cursor: 'pointer' }]}
        // @ts-expect-error web pointer handler
        onClick={onPress}
        onKeyDown={(event: { key?: string; preventDefault?: () => void }) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault?.();
            onPress();
          }
        }}
        tabIndex={0}
        role="group"
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} className="active:opacity-95">
      <View style={cardStyle}>{children}</View>
    </Pressable>
  );
}

export function LoungeAnonymousBadge({ label }: { label: string }) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <View
      style={{
        backgroundColor: lounge.accentMuted,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: lounge.border,
      }}
    >
      <Text
        style={{
          fontFamily: 'Pretendard-SemiBold',
          fontSize: 11,
          color: lounge.accentSoft,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function LoungeMetaText({ children }: { children: string }) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <Text
      style={{
        fontFamily: 'Pretendard',
        fontSize: 12,
        lineHeight: 18,
        color: lounge.textMuted,
      }}
    >
      {children}
    </Text>
  );
}

export function LoungeTitle({
  children,
  numberOfLines,
}: {
  children: string;
  numberOfLines?: number;
}) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <Text
      numberOfLines={numberOfLines}
      style={{
        fontFamily: 'Pretendard-Bold',
        fontSize: 17,
        lineHeight: 24,
        color: lounge.text,
      }}
    >
      {children}
    </Text>
  );
}

export function LoungeBody({
  children,
  numberOfLines,
}: {
  children: string;
  numberOfLines?: number;
}) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <Text
      numberOfLines={numberOfLines}
      style={{
        fontFamily: 'Pretendard',
        fontSize: 14,
        lineHeight: 22,
        color: lounge.textSecondary,
      }}
    >
      {children}
    </Text>
  );
}

export function LoungeTag({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const { lounge } = useEmsLoungeTheme();
  const text = onPress ? (label.startsWith('#') ? label : `#${label}`) : label;

  if (!onPress) {
    return (
      <View
        style={{
          backgroundColor: lounge.accentMuted,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: lounge.border,
        }}
      >
        <Text
          style={{
            fontFamily: 'Pretendard-Medium',
            fontSize: 11,
            color: lounge.accentSoft,
          }}
        >
          {text}
        </Text>
      </View>
    );
  }

  return (
    <LoungeFilterPill label={text} active={Boolean(active)} onPress={onPress} compact />
  );
}

export function LoungeActionRow({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <View
      style={{
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: lounge.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View className="flex-row items-center gap-4">{left}</View>
      <View>{right}</View>
    </View>
  );
}

export function LoungeLikeButton({
  count,
  onPress,
}: {
  count: number;
  onPress?: () => void;
}) {
  const { lounge } = useEmsLoungeTheme();

  const handlePress = (event?: { stopPropagation?: () => void }) => {
    if (Platform.OS === 'web') {
      event?.stopPropagation?.();
    }
    onPress?.();
  };

  return (
    <Pressable
      className="flex-row items-center active:opacity-70"
      onPress={(event) => handlePress(event)}
    >
      <Ionicons name="heart-outline" size={18} color={lounge.textMuted} />
      <Text
        style={{
          marginLeft: 6,
          fontFamily: 'Pretendard-Medium',
          fontSize: 13,
          color: lounge.textSecondary,
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}

export function LoungeCommentButton({ count }: { count: number }) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <View className="flex-row items-center">
      <Ionicons name="chatbubble-outline" size={17} color={lounge.textMuted} />
      <Text
        style={{
          marginLeft: 6,
          fontFamily: 'Pretendard-Medium',
          fontSize: 13,
          color: lounge.textSecondary,
        }}
      >
        {count}
      </Text>
    </View>
  );
}

export function LoungeBackBar({ label, onPress }: { label: string; onPress: () => void }) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <Pressable
      className="mb-4 flex-row items-center active:opacity-70"
      onPress={onPress}
      style={{ paddingHorizontal: EMS_LOUNGE_SPACING.screen }}
    >
      <Ionicons name="arrow-back" size={22} color={lounge.text} />
      <Text
        style={{
          marginLeft: 8,
          fontFamily: 'Pretendard-SemiBold',
          fontSize: 15,
          color: lounge.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function LoungeErrorBanner({ message }: { message: string }) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <View
      style={{
        marginHorizontal: EMS_LOUNGE_SPACING.screen,
        marginTop: 12,
        borderRadius: 14,
        padding: 14,
        backgroundColor: lounge.errorBg,
        borderWidth: 1,
        borderColor: lounge.border,
      }}
    >
      <Text style={{ fontFamily: 'Pretendard', fontSize: 13, color: lounge.error }}>
        {message}
      </Text>
    </View>
  );
}

export function LoungePrimaryButton({
  label,
  icon,
  onPress,
  compact,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  compact?: boolean;
}) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <Pressable
      className="flex-row items-center justify-center active:opacity-90"
      style={{
        backgroundColor: lounge.accent,
        borderRadius: 12,
        paddingVertical: compact ? 10 : 14,
        paddingHorizontal: compact ? 16 : 20,
      }}
      onPress={onPress}
    >
      {icon ? <Ionicons name={icon} size={18} color="#FFFFFF" style={{ marginRight: 8 }} /> : null}
      <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: 15, color: '#FFFFFF' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 상단 글쓰기·액션 — 투박한 흰/네이비 박스 없이 칩 스타일 */
export function LoungeWriteBar({
  label,
  onPress,
  trailing,
  icon = 'create-outline',
}: {
  label: string;
  onPress: () => void;
  trailing?: ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <LoungeTopSection>
      <View className="flex-row items-center gap-3">
        <Pressable
          className="flex-1 flex-row items-center justify-center active:opacity-90"
          style={{
            backgroundColor: lounge.accent,
            borderRadius: 999,
            paddingVertical: 12,
            paddingHorizontal: 20,
          }}
          onPress={onPress}
        >
          <Ionicons name={icon} size={18} color="#FFFFFF" />
          <Text
            style={{
              marginLeft: 8,
              fontFamily: 'Pretendard-SemiBold',
              fontSize: 14,
              color: '#FFFFFF',
            }}
          >
            {label}
          </Text>
        </Pressable>
        {trailing}
      </View>
    </LoungeTopSection>
  );
}

/** 필터·탭 칩 */
export function LoungeFilterPill({
  label,
  active,
  onPress,
  compact,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const { chip } = useEmsLoungeTheme();

  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-85"
      style={{
        backgroundColor: active ? chip.activeBg : chip.inactiveBg,
        paddingHorizontal: compact ? 12 : chip.paddingHorizontal,
        paddingVertical: compact ? 7 : chip.paddingVertical,
        borderRadius: chip.radius,
        borderWidth: active ? 0 : 1,
        borderColor: chip.inactiveBorder,
      }}
    >
      <Text
        style={{
          fontFamily: 'Pretendard-SemiBold',
          fontSize: compact ? 11 : 13,
          color: active ? chip.activeText : chip.inactiveText,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** 아이콘만 있는 상단 액션 버튼 */
export function LoungeIconAction({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      className="h-10 w-10 items-center justify-center rounded-full active:opacity-90"
      style={{
        backgroundColor: lounge.surfaceElevated,
        borderWidth: 1,
        borderColor: lounge.border,
      }}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={lounge.accentSoft} />
    </Pressable>
  );
}

export function LoungeInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  minHeight,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  minHeight?: number;
}) {
  const { lounge } = useEmsLoungeTheme();

  return (
    <TextInput
      style={{
        marginBottom: 12,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: lounge.surfaceElevated,
        borderWidth: 1,
        borderColor: lounge.border,
        fontFamily: 'Pretendard',
        fontSize: 14,
        color: lounge.text,
        minHeight,
        textAlignVertical: multiline ? 'top' : 'auto',
      }}
      placeholder={placeholder}
      placeholderTextColor={lounge.textMuted}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
    />
  );
}

/**
 * 전역 플로팅 액션 버튼 (FAB)
 * 모바일 화면에 최적화된 플러스(+) 아이콘 형태
 */
export function LoungeFab({
  onPress,
  accessibilityLabel = '글쓰기',
  avoidGlobalMoreFab = false,
}: {
  onPress: () => void;
  accessibilityLabel?: string;
  /** 글로벌 더보기 FAB와 겹치지 않도록 왼쪽으로 밀기 */
  avoidGlobalMoreFab?: boolean;
}) {
  const { lounge } = useEmsLoungeTheme();
  const insets = useSafeAreaInsets();
  const { nestedAboveMainTabBar } = useParamedicTabLayout();
  const showGlobalMoreFab = useShowGlobalMoreFab();
  const metrics = getExpertTabBarMetrics(insets.bottom, {
    compact: false,
    nestedAboveMainTabBar,
  });

  const rightOffset =
    avoidGlobalMoreFab && showGlobalMoreFab ? 20 + DRAGGABLE_FAB_SIZE + 12 : 20;

  const fabStyle = {
    position: 'absolute' as const,
    right: rightOffset,
    bottom: metrics.occupiedBottomSpace + 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: lounge.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...EMS_LOUNGE_SHADOW.cardSoft,
    elevation: 130,
    zIndex: 1250,
    cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
  };

  if (Platform.OS === 'web') {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        style={fabStyle}
        // @ts-expect-error web pointer handler
        onClick={onPress}
        onKeyDown={(event: { key?: string; preventDefault?: () => void }) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault?.();
            onPress();
          }
        }}
        tabIndex={0}
        role="button"
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="active:opacity-90"
      style={fabStyle}
    >
      <Ionicons name="add" size={32} color="#FFFFFF" />
    </Pressable>
  );
}

export const loungeListContent = {
  paddingHorizontal: EMS_LOUNGE_SPACING.screen,
  paddingTop: 4,
  paddingBottom: 96,
} as const;

/** EMS 서브 탭 바 높이에 맞춘 리스트 하단 여백 */
export function useLoungeListContentStyle(extraBottom = 12) {
  const insets = useSafeAreaInsets();
  const { nestedAboveMainTabBar } = useParamedicTabLayout();
  const metrics = getExpertTabBarMetrics(insets.bottom, {
    compact: false,
    nestedAboveMainTabBar,
  });

  return {
    paddingHorizontal: EMS_LOUNGE_SPACING.screen,
    paddingTop: 4,
    paddingBottom: metrics.occupiedBottomSpace + extraBottom,
  };
}
