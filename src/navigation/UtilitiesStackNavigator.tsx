import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDeferredScreen } from '@/navigation/deferredScreen';

export type UtilitiesStackParamList = {
  PediatricAntipyreticCalc: undefined;
  MedicationLogTimer: undefined;
  EmergencyContactCard: undefined;
  LocalCommunityTalk: undefined;
  SymptomOtcGuide: undefined;
};

const Stack = createNativeStackNavigator<UtilitiesStackParamList>();

const PediatricAntipyreticCalculatorScreen = createDeferredScreen(
  () => require('@/screens/utilities/PediatricAntipyreticCalculatorScreen').PediatricAntipyreticCalculatorScreen,
);
const MedicationLogTimerScreen = createDeferredScreen(
  () => require('@/screens/utilities/MedicationLogTimerScreen').MedicationLogTimerScreen,
);
const EmergencyContactCardScreen = createDeferredScreen(
  () => require('@/screens/utilities/EmergencyContactCardScreen').EmergencyContactCardScreen,
);
const LocalCommunityTalkScreen = createDeferredScreen(
  () => require('@/screens/utilities/LocalCommunityTalkScreen').LocalCommunityTalkScreen,
);
const SymptomOtcGuideScreen = createDeferredScreen(
  () => require('@/screens/utilities/SymptomOtcGuideScreen').SymptomOtcGuideScreen,
);

export function UtilitiesStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="PediatricAntipyreticCalc" component={PediatricAntipyreticCalculatorScreen} />
      <Stack.Screen name="MedicationLogTimer" component={MedicationLogTimerScreen} />
      <Stack.Screen name="EmergencyContactCard" component={EmergencyContactCardScreen} />
      <Stack.Screen name="LocalCommunityTalk" component={LocalCommunityTalkScreen} />
      <Stack.Screen name="SymptomOtcGuide" component={SymptomOtcGuideScreen} />
    </Stack.Navigator>
  );
}
