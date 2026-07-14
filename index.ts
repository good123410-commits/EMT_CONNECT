import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { enableScreens } from 'react-native-screens';
import { registerRootComponent } from 'expo';

import App from './App';

if (__DEV__) {
  console.log('[EMT_CONNECT] JS 엔트리 시작');
}

enableScreens();
registerRootComponent(App);
