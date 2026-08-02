import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

/**
 * 메인 5탭 — 전체 너비 균등 분할 (flex 1 × 5)
 * 가로 safe-area 패딩 제거로 양끝 대칭 유지
 */
export function MainTabBar(props: BottomTabBarProps) {
  const insets = {
    top: 0,
    right: 0,
    bottom: props.insets.bottom,
    left: 0,
  };

  return (
    <View style={styles.root}>
      <BottomTabBar
        {...props}
        insets={insets}
        style={[props.style, styles.bar]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignSelf: 'stretch',
  },
  bar: {
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
});
