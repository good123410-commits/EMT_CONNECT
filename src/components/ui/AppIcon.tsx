import { MaterialCommunityIcons } from '@expo/vector-icons';
import { APP_ICON_SIZE } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';

export type AppIconName = keyof typeof MaterialCommunityIcons.glyphMap;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
};

/** 앱 전역 아이콘 — MaterialCommunityIcons Outlined 스타일 통일 */
export function AppIcon({
  name,
  size = APP_ICON_SIZE.md,
  color,
}: AppIconProps) {
  const { colors } = useThemedColors();
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color ?? colors.textSecondary}
    />
  );
}
