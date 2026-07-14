import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { useUserRole } from '@/contexts/UserRoleContext';
import { ExpertModeNavigator } from '@/navigation/ExpertModeNavigator';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Expert'>;

/** 제스처/시스템 뒤로가기로 Expert 스택이 pop될 때 isExpertMode 동기화 */
export function ExpertRouteScreen({ navigation }: Props) {
  const { exitExpertMode } = useUserRole();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      exitExpertMode();
    });
    return unsubscribe;
  }, [navigation, exitExpertMode]);

  return <ExpertModeNavigator />;
}
