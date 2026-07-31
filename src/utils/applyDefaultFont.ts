import { Text, TextInput } from 'react-native';
import { APP_FONT } from '@/constants/appTheme';

/** Pretendard 로드 후 전역 Text 기본 폰트 적용 */
export function applyDefaultFont() {
  const baseStyle = { fontFamily: APP_FONT.regular };

  if (Text.defaultProps == null) {
    Text.defaultProps = {};
  }
  Text.defaultProps.style = baseStyle;

  if (TextInput.defaultProps == null) {
    TextInput.defaultProps = {};
  }
  TextInput.defaultProps.style = baseStyle;
}
