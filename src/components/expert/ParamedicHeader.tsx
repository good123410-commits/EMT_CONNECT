import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EMS_LOUNGE } from '@/constants/emsLoungeTheme';
import { useUserRole } from '@/contexts/UserRoleContext';

/** 히든 라운지 — safe area + 전문가 모드 나가기 */
export function ParamedicHeader() {
  const { isExpertMode, exitExpertMode } = useUserRole();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: EMS_LOUNGE.background }}>
      {isExpertMode ? (
        <View className="flex-row justify-end px-4 pb-1">
          <Pressable
            onPress={exitExpertMode}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center rounded-full active:opacity-80"
            style={{ backgroundColor: EMS_LOUNGE.navyMid }}
          >
            <Ionicons name="log-out-outline" size={18} color="#CBD5E1" />
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
