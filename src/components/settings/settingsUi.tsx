import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

export function SettingsToggleRow({
  icon,
  label,
  subtitle,
  value,
  onValueChange,
  showDivider = true,
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  showDivider?: boolean;
  disabled?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-4 ${showDivider ? 'border-b border-kemix-border-light' : ''}`}
    >
      <View className="mr-3 flex-1 flex-row items-start gap-3">
        <Ionicons name={icon} size={22} color="#475569" />
        <View className="flex-1">
          <Text className="text-base font-medium text-kemix-text">{label}</Text>
          {subtitle ? (
            <Text className="mt-1 text-xs leading-5 text-kemix-text-secondary">{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
        thumbColor={value ? '#2563eb' : '#f8fafc'}
      />
    </View>
  );
}

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-kemix-muted">
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-kemix-border bg-kemix-surface">
        {children}
      </View>
    </View>
  );
}

export function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  showDivider = true,
  accent = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  showDivider?: boolean;
  accent?: 'default' | 'green' | 'violet';
}) {
  const iconColor =
    accent === 'green' ? '#15803d' : accent === 'violet' ? '#7c3aed' : '#475569';

  return (
    <Pressable
      className={`flex-row items-center px-4 py-4 active:bg-kemix-bg ${showDivider ? 'border-b border-kemix-border-light' : ''}`}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={iconColor} />
      <View className="ml-3 flex-1">
        <Text className="text-base font-medium text-kemix-text">{label}</Text>
        {typeof subtitle === 'string' && subtitle.length > 0 ? (
          <Text className="mt-0.5 text-xs text-kemix-text-secondary">{subtitle}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </Pressable>
  );
}
