import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useExpertTabBarHeight } from '@/navigation/expertTabBarOptions';
import type { UserRole } from '@/lib/supabaseClient';
import { getRoleLabel } from '@/utils/roleAccess';

const DEV_ROLES: { role: UserRole; label: string; color: string }[] = [
  { role: 'user', label: '일반', color: '#64748b' },
  { role: 'admin', label: '관리', color: '#7c3aed' },
  { role: 'private_ems', label: '사설', color: '#dc2626' },
  { role: 'paramedic', label: '구급', color: '#2563eb' },
  { role: 'hospital', label: '병원', color: '#059669' },
];

const TRIPLE_TAP_WINDOW_MS = 900;
const SECRET_ZONE_SIZE = 44;

/**
 * __DEV__ 전용 치트키 — 헤더/탭바와 완전 격리
 * - 우하단 반투명 FAB 탭 → 모달
 * - 좌상단 구석 3연속 탭 → 모달
 */
export function DevRoleCheatMenu() {
  const insets = useSafeAreaInsets();
  const { role, setRole, isApproved, enterExpertMode, isExpertMode } = useUserRole();
  const expertTabBarHeight = useExpertTabBarHeight();
  const fabBottom = isExpertMode ? expertTabBarHeight + 12 : insets.bottom + 72;
  const [visible, setVisible] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = useCallback(() => setVisible(true), []);
  const closeMenu = useCallback(() => setVisible(false), []);

  const handleSecretTap = useCallback(
    (_event: GestureResponderEvent) => {
      tapCountRef.current += 1;

      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, TRIPLE_TAP_WINDOW_MS);

      if (tapCountRef.current >= 3) {
        tapCountRef.current = 0;
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        openMenu();
      }
    },
    [openMenu],
  );

  const handleSelectRole = (next: UserRole, approved?: boolean) => {
    setRole(next, approved !== undefined ? { isApproved: approved } : undefined);
    if (next !== 'user' && (approved ?? true)) {
      enterExpertMode();
    }
    closeMenu();
  };

  if (!__DEV__) return null;

  return (
    <>
      {/* 좌상단 3연속 탭 히든 존 — 시각적 흔적 없음 */}
      <Pressable
        onPress={handleSecretTap}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          top: insets.top,
          left: 0,
          width: SECRET_ZONE_SIZE,
          height: SECRET_ZONE_SIZE,
          zIndex: 9999,
        }}
      />

      {/* 우하단 반투명 FAB */}
      <Pressable
        onPress={openMenu}
        accessibilityLabel="개발자 메뉴"
        style={{
          position: 'absolute',
          bottom: fabBottom,
          right: 10,
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: 'rgba(15, 23, 42, 0.28)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
        }}
      >
        <Ionicons name="construct-outline" size={15} color="rgba(255,255,255,0.85)" />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onPress={closeMenu}
        >
          <Pressable
            className="rounded-t-3xl bg-white px-4 pb-8 pt-3"
            style={{ paddingBottom: insets.bottom + 16 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full bg-slate-200" />
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm font-bold text-slate-800">DEV · 직군 치트키</Text>
              <Pressable onPress={closeMenu} hitSlop={12}>
                <Ionicons name="close" size={22} color="#94a3b8" />
              </Pressable>
            </View>

            <Text className="mb-4 text-xs text-slate-500">
              현재: {getRoleLabel(role)}
              {isApproved ? ' (승인됨)' : ' (승인 대기)'} · [구급]/[사설] 선택 시 전용 탭 즉시 진입
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {DEV_ROLES.map(({ role: r, label, color }) => {
                const active = role === r;
                return (
                  <Pressable
                    key={r}
                    className="min-w-[22%] flex-1 items-center rounded-xl py-3"
                    style={{
                      backgroundColor: active ? `${color}18` : '#f8fafc',
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? color : '#e2e8f0',
                    }}
                    onPress={() => handleSelectRole(r)}
                    onLongPress={() => {
                      if (r !== 'user') handleSelectRole(r, false);
                    }}
                  >
                    <Text className="text-sm font-bold" style={{ color: active ? color : '#64748b' }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="mt-3 text-center text-[10px] text-slate-400">
              길게 누르면 is_approved=false (승인 대기 화면)
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
