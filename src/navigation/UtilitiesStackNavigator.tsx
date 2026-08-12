import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDeferredScreen } from '@/navigation/deferredScreen';

export type UtilitiesStackParamList = {
  MedicalTerminology: undefined;
  PediatricAntipyreticCalc: undefined;
  MedicationLogTimer: undefined;
  EmergencyResponse: undefined;
  LocalCommunityTalk: undefined;
  SymptomOtcGuide: undefined;
};

const Stack = createNativeStackNavigator<UtilitiesStackParamList>();

const MedicalTerminologyScreen = createDeferredScreen(
  () => require('@/screens/utilities/MedicalTerminologyScreen').MedicalTerminologyScreen,
);
const PediatricAntipyreticCalculatorScreen = createDeferredScreen(
  () => require('@/screens/utilities/PediatricAntipyreticCalculatorScreen').PediatricAntipyreticCalculatorScreen,
);
const MedicationLogTimerScreen = createDeferredScreen(
  () => require('@/screens/utilities/MedicationLogTimerScreen').MedicationLogTimerScreen,
);
const EmergencyResponseScreen = createDeferredScreen(
  () => require('@/screens/utilities/EmergencyResponseScreen').EmergencyResponseScreen,
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
      <Stack.Screen name="MedicalTerminology" component={MedicalTerminologyScreen} />
      <Stack.Screen name="PediatricAntipyreticCalc" component={PediatricAntipyreticCalculatorScreen} />
      <Stack.Screen name="MedicationLogTimer" component={MedicationLogTimerScreen} />
      <Stack.Screen name="EmergencyResponse" component={EmergencyResponseScreen} />
      <Stack.Screen name="LocalCommunityTalk" component={LocalCommunityTalkScreen} />
      <Stack.Screen name="SymptomOtcGuide" component={SymptomOtcGuideScreen} />
    </Stack.Navigator>
  );
}
