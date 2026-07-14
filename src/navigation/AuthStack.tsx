import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDeferredScreen } from '@/navigation/deferredScreen';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const LoginScreen = createDeferredScreen(() => require('@/screens/auth/LoginScreen').LoginScreen);
const SignUpScreen = createDeferredScreen(() => require('@/screens/auth/SignUpScreen').SignUpScreen);

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
