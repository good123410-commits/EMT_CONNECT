import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { useUserRole } from '@/contexts/UserRoleContext';

/** 히든 라운지 — 앱 테마와 연속되는 상단 safe area */
export function ParamedicHeader() {
  const { isExpertMode, exitExpertMode } = useUserRole();
  const { lounge } = useEmsLoungeTheme();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: lounge.background }}>
      {isExpertMode ? (
        <View className="flex-row justify-end px-4 pb-1 pt-1">
          <Pressable
            onPress={exitExpertMode}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-80"
            style={{
              backgroundColor: lounge.surfaceElevated,
              borderWidth: 1,
              borderColor: lounge.border,
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={lounge.textSecondary} />
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
