import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, type ReactNode } from 'react-native';

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
