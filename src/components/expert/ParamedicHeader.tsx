import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EMS_LOUNGE } from '@/constants/emsLoungeTheme';
import { useUserRole } from '@/contexts/UserRoleContext';

/** 히든 라운지 — 다크 배경과 연속되는 상단 safe area */
export function ParamedicHeader() {
  const { isExpertMode, exitExpertMode } = useUserRole();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: EMS_LOUNGE.background }}>
      {isExpertMode ? (
        <View className="flex-row justify-end px-4 pb-1 pt-1">
          <Pressable
            onPress={exitExpertMode}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-80"
            style={{
              backgroundColor: EMS_LOUNGE.surfaceElevated,
              borderWidth: 1,
              borderColor: EMS_LOUNGE.border,
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={EMS_LOUNGE.textSecondary} />
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
