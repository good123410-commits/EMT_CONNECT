import { MaterialCommunityIcons } from '@expo/vector-icons';
import { APP_COLORS, APP_ICON_SIZE } from '@/constants/appTheme';

export type AppIconName = keyof typeof MaterialCommunityIcons.glyphMap;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
};

/** 앱 전역 아이콘 — MaterialCommunityIcons Outlined 스타일 통일 */
export function AppIcon({ name, size = APP_ICON_SIZE.md, color = APP_COLORS.textSecondary }: AppIconProps) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}
