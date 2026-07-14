import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDeferredScreen } from '@/navigation/deferredScreen';
import { LoadingScreen } from '@/screens/LoadingScreen';
import type { RootStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AuthStackScreen = createDeferredScreen(() => require('@/navigation/AuthStack').AuthStack);
const MainTabScreen = createDeferredScreen(
  () => require('@/navigation/MainTabNavigator').MainTabNavigator,
);
const ExpertRouteScreen = createDeferredScreen(
  () => require('@/navigation/ExpertRouteScreen').ExpertRouteScreen,
);

/** 루트 화면 지연 로드 — Loading만 즉시, 나머지는 전환 시 require */
export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Loading"
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Loading" component={LoadingScreen} />
      <Stack.Screen name="Auth" component={AuthStackScreen} />
      <Stack.Screen name="Main" component={MainTabScreen} />
      <Stack.Screen
        name="Expert"
        component={ExpertRouteScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

export type { RootStackParamList } from '@/navigation/types';
