import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View, type ViewStyle } from 'react-native';
import { EMS_LOUNGE, EMS_LOUNGE_SHADOW, EMS_LOUNGE_SPACING } from '@/constants/emsLoungeTheme';

export function LoungeScreen({ children }: { children: ReactNode }) {
  return (
    <View className="flex-1" style={{ backgroundColor: EMS_LOUNGE.background }}>
      {children}
    </View>
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
          borderRadius: 20,
          padding: EMS_LOUNGE_SPACING.cardPadding,
          marginBottom: EMS_LOUNGE_SPACING.cardGap,
          ...EMS_LOUNGE_SHADOW.card,
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
        backgroundColor: EMS_LOUNGE.navyMid,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          fontFamily: 'Pretendard-SemiBold',
          fontSize: 11,
          color: '#E2E8F0',
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
        color: EMS_LOUNGE.navy,
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
  const content = (
    <View
      style={{
        backgroundColor: active ? EMS_LOUNGE.navy : EMS_LOUNGE.borderLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          fontFamily: 'Pretendard-Medium',
          fontSize: 12,
          color: active ? '#FFFFFF' : EMS_LOUNGE.textSecondary,
        }}
      >
        #{label.replace(/^#/, '')}
      </Text>
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-80">
        {content}
      </Pressable>
    );
  }
  return content;
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
        borderTopColor: EMS_LOUNGE.borderLight,
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
      <Ionicons name="arrow-back" size={22} color={EMS_LOUNGE.navy} />
      <Text
        style={{
          marginLeft: 8,
          fontFamily: 'Pretendard-SemiBold',
          fontSize: 15,
          color: EMS_LOUNGE.navy,
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
        backgroundColor: EMS_LOUNGE.navy,
        borderRadius: 14,
        paddingVertical: compact ? 10 : 14,
        paddingHorizontal: compact ? 16 : 20,
        ...EMS_LOUNGE_SHADOW.cardSoft,
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
    <View
      style={{
        paddingHorizontal: EMS_LOUNGE_SPACING.screen,
        paddingTop: EMS_LOUNGE_SPACING.screenTop,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <Pressable
        className="flex-1 flex-row items-center justify-center active:opacity-90"
        style={{
          backgroundColor: EMS_LOUNGE.navy,
          borderRadius: 16,
          paddingVertical: 14,
          ...EMS_LOUNGE_SHADOW.cardSoft,
        }}
        onPress={onPress}
      >
        <Ionicons name={icon} size={20} color="#FFFFFF" />
        <Text
          style={{
            marginLeft: 8,
            fontFamily: 'Pretendard-SemiBold',
            fontSize: 15,
            color: '#FFFFFF',
          }}
        >
          {label}
        </Text>
      </Pressable>
      {trailing}
    </View>
  );
}

export function LoungeFilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? EMS_LOUNGE.navy : EMS_LOUNGE.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: active ? 0 : 1,
        borderColor: EMS_LOUNGE.border,
        ...EMS_LOUNGE_SHADOW.cardSoft,
      }}
    >
      <Text
        style={{
          fontFamily: 'Pretendard-SemiBold',
          fontSize: 12,
          color: active ? '#FFFFFF' : EMS_LOUNGE.textSecondary,
        }}
      >
        {label}
      </Text>
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
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: EMS_LOUNGE.surface,
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
