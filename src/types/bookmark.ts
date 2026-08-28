import type { AppIconName } from '@/components/ui/AppIcon';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import type { UtilitiesStackParamList } from '@/navigation/UtilitiesStackNavigator';

export type BookmarkTarget =
  | {
      type: 'mainTab';
      screen: keyof MainTabParamList;
      params?: MainTabParamList[keyof MainTabParamList];
    }
  | { type: 'utility'; screen: keyof UtilitiesStackParamList }
  | { type: 'chemical' };

export type BookmarkItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: AppIconName;
  iconColor: string;
  iconBg: string;
  target: BookmarkTarget;
  createdAt: string;
};

export type BookmarkInput = Omit<BookmarkItem, 'createdAt'>;
