import { Platform, Text, View } from 'react-native';
import { APP_FONT } from '@/constants/appTheme';

/** 메인 하단 탭 전용 — 토스 스타일 컴팩트 라벨 */
export const MAIN_TAB_LABEL_FONT_SIZE = 11;

export function MainTabBarLabel({
  children,
  color,
}: {
  children: string;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={{ width: '100%', alignItems: 'center', paddingHorizontal: 1 }}>
      <Text
        numberOfLines={1}
        allowFontScaling={false}
        adjustsFontSizeToFit={Platform.OS !== 'web'}
        minimumFontScale={0.72}
        style={{
          color,
          fontSize: MAIN_TAB_LABEL_FONT_SIZE,
          lineHeight: 14,
          fontFamily: APP_FONT.semibold,
          marginTop: 2,
          marginBottom: 0,
          textAlign: 'center',
          width: '100%',
          includeFontPadding: false,
          ...(Platform.OS === 'android' ? { textAlignVertical: 'center' } : {}),
        }}
      >
        {children}
      </Text>
    </View>
  );
}
