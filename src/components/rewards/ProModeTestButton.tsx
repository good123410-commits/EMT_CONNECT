import { Pressable, Text, View } from 'react-native';
import { useUserRole } from '@/contexts/UserRoleContext';
import type { UserRole } from '@/lib/supabaseClient';
import { getRoleLabel } from '@/utils/roleAccess';

const TEST_ROLES: UserRole[] = ['user', 'paramedic', 'hospital', 'private_ems'];

/** @deprecated DevRoleCheatMenu(플로팅 FAB)로 대체됨 */
export function ProModeTestButton() {
  const { role, setRole } = useUserRole();

  const cycleRole = () => {
    const idx = TEST_ROLES.indexOf(role);
    const next = TEST_ROLES[(idx + 1) % TEST_ROLES.length];
    setRole(next);
  };

  return (
    <Pressable
      className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3"
      onPress={cycleRole}
    >
      <Text className="text-xs text-slate-500">
        (구) 역할 순환 — 상단 DEV 바를 사용하세요 · 현재: {getRoleLabel(role)}
      </Text>
    </Pressable>
  );
}
