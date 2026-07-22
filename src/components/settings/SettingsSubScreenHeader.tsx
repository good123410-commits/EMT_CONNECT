import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SettingsSubScreenHeaderProps = {
  title: string;
  subtitle?: string;
};

export function SettingsSubScreenHeader({ title, subtitle }: SettingsSubScreenHeaderProps) {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white">
      <View className="px-4 pb-4 pt-1">
        <Pressable className="mb-3 flex-row items-center self-start" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
          <Text className="ml-2 font-semibold text-slate-700">설정</Text>
        </Pressable>
        <Text className="text-xl font-bold text-slate-900">{title}</Text>
        {subtitle ? <Text className="mt-1 text-sm text-slate-500">{subtitle}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

export function useIsSettingsSubScreen(): boolean {
  const navigation = useNavigation();
  const parent = navigation.getParent();
  const parentRoutes = parent?.getState()?.routeNames ?? [];
  return parentRoutes.includes('SettingsHome');
}
