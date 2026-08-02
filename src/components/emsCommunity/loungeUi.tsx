import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EMS_LOUNGE,
  EMS_LOUNGE_CHIP,
  EMS_LOUNGE_SHADOW,
  EMS_LOUNGE_SPACING,
} from '@/constants/emsLoungeTheme';
import { getExpertTabBarMetrics } from '@/navigation/expertTabBarOptions';
import { useParamedicTabLayout } from '@/navigation/paramedicTabLayout';

export function LoungeScreen({ children }: { children: ReactNode }) {
  return (
    <View className="flex-1" style={{ backgroundColor: EMS_LOUNGE.background }}>
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
  const inner = (
    <View
      style={[
        {
          backgroundColor: EMS_LOUNGE.surface,
          borderRadius: 16,
          padding: EMS_LOUNGE_SPACING.cardPadding,
          marginBottom: EMS_LOUNGE_SPACING.cardGap,
          borderWidth: 1,
          borderColor: EMS_LOUNGE.border,
          ...EMS_LOUNGE_SHADOW.cardSoft,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-95">
        {inner}
      </Pressable>
    );
  }
  return inner;
}

export function LoungeAnonymousBadge({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: EMS_LOUNGE.accentMuted,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: EMS_LOUNGE.border,
      }}
    >
      <Text
        style={{
          fontFamily: 'Pretendard-SemiBold',
          fontSize: 11,
          color: EMS_LOUNGE.accentSoft,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function LoungeMetaText({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: 'Pretendard',
        fontSize: 12,
        lineHeight: 18,
        color: EMS_LOUNGE.textMuted,
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
  return (
    <Text
      numberOfLines={numberOfLines}
      style={{
        fontFamily: 'Pretendard-Bold',
        fontSize: 17,
        lineHeight: 24,
        color: EMS_LOUNGE.text,
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
  return (
    <Text
      numberOfLines={numberOfLines}
      style={{
        fontFamily: 'Pretendard',
        fontSize: 14,
        lineHeight: 22,
        color: EMS_LOUNGE.textSecondary,
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
  const text = label.startsWith('#') ? label : `#${label.replace(/^#/, '')}`;

  if (!onPress) {
    return (
      <View
        style={{
          backgroundColor: EMS_LOUNGE.accentMuted,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: EMS_LOUNGE.border,
        }}
      >
        <Text
          style={{
            fontFamily: 'Pretendard-Medium',
            fontSize: 11,
            color: EMS_LOUNGE.accentSoft,
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
  return (
    <View
      style={{
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: EMS_LOUNGE.border,
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
  return (
    <Pressable className="flex-row items-center active:opacity-70" onPress={onPress}>
      <Ionicons name="heart-outline" size={18} color={EMS_LOUNGE.textMuted} />
      <Text
        style={{
          marginLeft: 6,
          fontFamily: 'Pretendard-Medium',
          fontSize: 13,
          color: EMS_LOUNGE.textSecondary,
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}

export function LoungeCommentButton({ count }: { count: number }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name="chatbubble-outline" size={17} color={EMS_LOUNGE.textMuted} />
      <Text
        style={{
          marginLeft: 6,
          fontFamily: 'Pretendard-Medium',
          fontSize: 13,
          color: EMS_LOUNGE.textSecondary,
        }}
      >
        {count}
      </Text>
    </View>
  );
}

export function LoungeBackBar({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      className="mb-4 flex-row items-center active:opacity-70"
      onPress={onPress}
      style={{ paddingHorizontal: EMS_LOUNGE_SPACING.screen }}
    >
      <Ionicons name="arrow-back" size={22} color={EMS_LOUNGE.text} />
      <Text
        style={{
          marginLeft: 8,
          fontFamily: 'Pretendard-SemiBold',
          fontSize: 15,
          color: EMS_LOUNGE.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function LoungeErrorBanner({ message }: { message: string }) {
  return (
    <View
      style={{
        marginHorizontal: EMS_LOUNGE_SPACING.screen,
        marginTop: 12,
        borderRadius: 14,
        padding: 14,
        backgroundColor: EMS_LOUNGE.errorBg,
        borderWidth: 1,
        borderColor: EMS_LOUNGE.border,
      }}
    >
      <Text style={{ fontFamily: 'Pretendard', fontSize: 13, color: EMS_LOUNGE.error }}>
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
  return (
    <Pressable
      className="flex-row items-center justify-center active:opacity-90"
      style={{
        backgroundColor: EMS_LOUNGE.accent,
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
  return (
    <LoungeTopSection>
      <View className="flex-row items-center gap-3">
        <Pressable
          className="flex-1 flex-row items-center justify-center active:opacity-90"
          style={{
            backgroundColor: EMS_LOUNGE.accent,
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

/** 다크 모드 필터·탭 칩 */
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
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-85"
      style={{
        backgroundColor: active ? EMS_LOUNGE_CHIP.activeBg : EMS_LOUNGE_CHIP.inactiveBg,
        paddingHorizontal: compact ? 12 : EMS_LOUNGE_CHIP.paddingHorizontal,
        paddingVertical: compact ? 7 : EMS_LOUNGE_CHIP.paddingVertical,
        borderRadius: EMS_LOUNGE_CHIP.radius,
        borderWidth: active ? 0 : 1,
        borderColor: EMS_LOUNGE_CHIP.inactiveBorder,
      }}
    >
      <Text
        style={{
          fontFamily: 'Pretendard-SemiBold',
          fontSize: compact ? 11 : 13,
          color: active ? EMS_LOUNGE_CHIP.activeText : EMS_LOUNGE_CHIP.inactiveText,
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
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      className="h-10 w-10 items-center justify-center rounded-full active:opacity-90"
      style={{
        backgroundColor: EMS_LOUNGE.surfaceElevated,
        borderWidth: 1,
        borderColor: EMS_LOUNGE.border,
      }}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={EMS_LOUNGE.accentSoft} />
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
  return (
    <TextInput
      style={{
        marginBottom: 12,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: EMS_LOUNGE.surfaceElevated,
        borderWidth: 1,
        borderColor: EMS_LOUNGE.border,
        fontFamily: 'Pretendard',
        fontSize: 14,
        color: EMS_LOUNGE.text,
        minHeight,
        textAlignVertical: multiline ? 'top' : 'auto',
      }}
      placeholder={placeholder}
      placeholderTextColor={EMS_LOUNGE.textMuted}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
    />
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
