export type UserNotificationSettings = {
  push_enabled_posts: boolean;
  push_enabled_comments: boolean;
  push_enabled_chats: boolean;
  expo_push_token: string | null;
};

export type NotificationSettingsPatch = Partial<
  Pick<
    UserNotificationSettings,
    'push_enabled_posts' | 'push_enabled_comments' | 'push_enabled_chats' | 'expo_push_token'
  >
>;

export const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  push_enabled_posts: true,
  push_enabled_comments: true,
  push_enabled_chats: true,
  expo_push_token: null,
};
