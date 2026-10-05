import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { registerRootComponent } from 'expo';

import App from './App';
import { warmUpLocationCache } from '@/services/locationService';

if (__DEV__) {
  console.log('[EMT_CONNECT] JS 엔트리 시작 (web)');
}

warmUpLocationCache();

enableScreens();
registerRootComponent(App);
