import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDeferredScreen } from '@/navigation/deferredScreen';

export type UtilitiesStackParamList = {
  MedicalTerminology: undefined;
  PediatricAntipyreticCalc: undefined;
  EmergencyResponse: undefined;
  LocationRescue: undefined;
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
const EmergencyResponseScreen = createDeferredScreen(
  () => require('@/screens/utilities/EmergencyResponseScreen').EmergencyResponseScreen,
);
const LocationRescueScreen = createDeferredScreen(
  () => require('@/screens/utilities/LocationRescueScreen').LocationRescueScreen,
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
      <Stack.Screen name="EmergencyResponse" component={EmergencyResponseScreen} />
      <Stack.Screen name="LocationRescue" component={LocationRescueScreen} />
      <Stack.Screen name="LocalCommunityTalk" component={LocalCommunityTalkScreen} />
      <Stack.Screen name="SymptomOtcGuide" component={SymptomOtcGuideScreen} />
    </Stack.Navigator>
  );
}
