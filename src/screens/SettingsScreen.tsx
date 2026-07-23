import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LOCATION_CONSENT_TEXT,
  PRIVACY_POLICY_TEXT,
  TERMS_OF_SERVICE_TEXT,
} from '@/constants/legalContent';
import { ServicePolicyModal } from '@/components/legal/ServicePolicyModal';
import { SettingsAdminPortalModal } from '@/components/settings/SettingsAdminPortalModal';
import { SettingsParamedicPortalModal } from '@/components/settings/SettingsParamedicPortalModal';
import { useAuth } from '@/contexts/AuthContext';
import { useOpeningIntro } from '@/contexts/OpeningIntroContext';
import { useExpertSettingsAccess } from '@/hooks/useExpertSettingsAccess';
import { openAuthScreen } from '@/navigation/rootNavigation';
import type { SettingsStackParamList } from '@/navigation/SettingsStackNavigator';

const LOCATION_CONSENT_KEY = 'ems_connect_location_consent_v1';

type LegalModalKind = 'privacy' | 'terms' | 'location' | 'servicePolicy' | null;

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { user, profile, signOut } = useAuth();
  const { replayOpeningIntro, resetOpeningIntroSnooze } = useOpeningIntro();
  const { canOpenAnswerInbox, isDbAdmin, showExpertSettingsMenu } = useExpertSettingsAccess();
  const [locationConsent, setLocationConsent] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalKind>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [paramedicPortalVisible, setParamedicPortalVisible] = useState(false);
  const [adminPortalVisible, setAdminPortalVisible] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(LOCATION_CONSENT_KEY).then((value) => {
      setLocationConsent(value === 'true');
    });
  }, []);

  const handleLocationConsentChange = useCallback(async (next: boolean) => {
    setLocationConsent(next);
    await AsyncStorage.setItem(LOCATION_CONSENT_KEY, next ? 'true' : 'false');

    if (next) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          '위치 권한 필요',
          '설정 > 앱 권한에서 위치 접근을 허용하면 주변 AED·응급실 검색이 더 정확해집니다.',
        );
      }
    }
  }, []);

  const handleDeleteAccountRequest = async () => {
    setDeleteSubmitting(true);
    try {
      // v1: Supabase Edge Function / 관리자 처리 연동 전 안내·로그아웃 뼈대
      await AsyncStorage.multiRemove([LOCATION_CONSENT_KEY]);
      if (user) {
        await signOut();
      }
      setDeleteModalVisible(false);
      Alert.alert(
        '탈퇴 요청 접수',
        '회원 탈퇴 및 데이터 삭제 요청이 접수되었습니다.\n영업일 기준 7일 이내 처리되며, 완료 시 등록 이메일로 안내드립니다.',
      );
    } catch (error) {
      Alert.alert(
        '요청 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView edges={['top']} className="border-b border-slate-200 bg-white px-4 pb-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="settings-outline" size={24} color="#0f172a" />
          <View>
            <Text className="text-xl font-bold text-slate-900">설정</Text>
            <Text className="text-sm text-slate-500">개인정보 · 약관 · 계정 관리</Text>
          </View>
        </View>
        {user ? (
          <Text className="mt-2 text-xs text-slate-400">
            {profile?.name ?? user.email ?? '로그인됨'}
          </Text>
        ) : (
          <Text className="mt-2 text-xs text-slate-400">게스트로 둘러보는 중</Text>
        )}
      </SafeAreaView>

      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-12 gap-4">
        <SettingsSection title="법적 고지">
          <SettingsRow
            icon="document-text-outline"
            label="개인정보 처리방침 안내"
            onPress={() => setLegalModal('privacy')}
          />
          <SettingsRow
            icon="reader-outline"
            label="서비스 이용약관"
            onPress={() => setLegalModal('terms')}
          />
          <SettingsRow
            icon="information-circle-outline"
            label="위치기반서비스 이용동의 안내"
            onPress={() => setLegalModal('location')}
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="위치기반서비스">
          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="mr-3 flex-1 flex-row items-start gap-3">
              <Ionicons name="location-outline" size={22} color="#2563eb" />
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900">
                  위치기반서비스 이용동의
                </Text>
                <Text className="mt-1 text-xs leading-5 text-slate-500">
                  주변 AED·응급실·약국 거리 계산에 사용됩니다.
                </Text>
              </View>
            </View>
            <Switch
              value={locationConsent}
              onValueChange={(value) => void handleLocationConsentChange(value)}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={locationConsent ? '#2563eb' : '#f8fafc'}
            />
          </View>
        </SettingsSection>

        {user ? (
          <SettingsSection title="계정">
            <SettingsRow icon="log-out-outline" label="로그아웃" onPress={() => void signOut()} />
          </SettingsSection>
        ) : (
          <SettingsSection title="계정">
            <SettingsRow
              icon="log-in-outline"
              label="로그인"
              subtitle="회원 전용 기능 이용"
              onPress={() => openAuthScreen('Login')}
            />
            <SettingsRow
              icon="person-add-outline"
              label="회원가입"
              subtitle="새 계정 만들기"
              onPress={() => openAuthScreen('SignUp')}
              showDivider={false}
            />
          </SettingsSection>
        )}

        <SettingsSection title="앱 화면">
          <SettingsRow
            icon="play-circle-outline"
            label="오프닝 인트로 다시 보기"
            subtitle="KEMIX 브랜드 오프닝 몽타주 재생"
            onPress={() => {
              void resetOpeningIntroSnooze();
              replayOpeningIntro();
            }}
          />
          <SettingsRow
            icon="eye-off-outline"
            label="오프닝 인트로 스누즈 해제"
            subtitle="‘오늘 하루 보지 않기’ 설정 초기화"
            onPress={() => {
              void resetOpeningIntroSnooze().then(() => {
                Alert.alert('완료', '다음 앱 실행 시 오프닝 인트로가 다시 표시됩니다.');
              });
            }}
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="서비스 안내">
          <SettingsRow
            icon="shield-checkmark-outline"
            label="운영 정책 및 면책 안내"
            onPress={() => setLegalModal('servicePolicy')}
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="전문가 · 운영">
          <SettingsRow
            icon="shield-checkmark-outline"
            label="구급대원 인증 · 전용 공간"
            subtitle="자격증 제출 · EMS 커뮤니티 · 답변함"
            onPress={() => setParamedicPortalVisible(true)}
            accent="green"
          />
          <SettingsRow
            icon="key-outline"
            label="관리자 모드"
            subtitle="Q&A 운영 대시보드 · 답변함"
            onPress={() => setAdminPortalVisible(true)}
            accent="violet"
            showDivider={false}
          />
        </SettingsSection>

        {isDbAdmin ? (
          <SettingsSection title="관리자">
            <SettingsRow
              icon="grid-outline"
              label="관리자 대시보드"
              subtitle="유저 · 인증 · 콘텐츠 · 구급차 통합 운영"
              onPress={() => navigation.navigate('AdminDashboard')}
              accent="violet"
              showDivider={false}
            />
          </SettingsSection>
        ) : null}

        {showExpertSettingsMenu ? (
          <SettingsSection title="바로가기">
            {canOpenAnswerInbox ? (
              <SettingsRow
                icon="mail-unread-outline"
                label="전문가 전용 답변함"
                subtitle="Q&A pending · Realtime"
                onPress={() => navigation.navigate('ParamedicAnswerInbox')}
                accent="green"
              />
            ) : null}
          </SettingsSection>
        ) : null}

        <View className="mt-2 overflow-hidden rounded-2xl border border-red-200 bg-white">
          <Pressable
            className="flex-row items-center gap-3 px-4 py-4 active:bg-red-50"
            onPress={() => setDeleteModalVisible(true)}
          >
            <Ionicons name="trash-outline" size={22} color="#dc2626" />
            <View className="flex-1">
              <Text className="text-base font-bold text-red-600">회원 탈퇴 및 데이터 삭제 요청</Text>
              <Text className="mt-1 text-xs text-slate-500">
                Google Play 정책에 따라 계정·개인정보 삭제를 요청할 수 있습니다.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fca5a5" />
          </Pressable>
        </View>

        <Text className="text-center text-xs text-slate-400">EMS Connect v1.0.0</Text>
      </ScrollView>

      <LegalDocumentModal
        visible={legalModal === 'privacy'}
        title="개인정보 처리방침"
        body={PRIVACY_POLICY_TEXT}
        onClose={() => setLegalModal(null)}
      />
      <LegalDocumentModal
        visible={legalModal === 'terms'}
        title="서비스 이용약관"
        body={TERMS_OF_SERVICE_TEXT}
        onClose={() => setLegalModal(null)}
      />
      <LegalDocumentModal
        visible={legalModal === 'location'}
        title="위치기반서비스 이용동의"
        body={LOCATION_CONSENT_TEXT}
        onClose={() => setLegalModal(null)}
      />
      <ServicePolicyModal
        visible={legalModal === 'servicePolicy'}
        onClose={() => setLegalModal(null)}
      />
      <SettingsParamedicPortalModal
        visible={paramedicPortalVisible}
        onClose={() => setParamedicPortalVisible(false)}
      />
      <SettingsAdminPortalModal
        visible={adminPortalVisible}
        onClose={() => setAdminPortalVisible(false)}
      />

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/45">
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-4">
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full bg-slate-200" />
            </View>
            <Text className="text-lg font-bold text-slate-900">회원 탈퇴 및 데이터 삭제</Text>
            <Text className="mt-3 text-sm leading-6 text-slate-600">
              탈퇴 시 계정 정보, 프로필, 포인트·리워드 기록(해당 시)이 삭제 요청됩니다.{'\n\n'}
              · 처리 기간: 영업일 기준 최대 7일{'\n'}
              · 삭제 후 동일 이메일 재가입 가능{'\n'}
              · 법령상 보관 의무가 있는 정보는 해당 기간 보관 후 파기
            </Text>
            <Pressable
              className={`mt-6 items-center rounded-xl py-3.5 ${deleteSubmitting ? 'bg-red-300' : 'bg-red-600'}`}
              disabled={deleteSubmitting}
              onPress={() => void handleDeleteAccountRequest()}
            >
              <Text className="font-bold text-white">
                {deleteSubmitting ? '처리 중...' : '탈퇴 및 삭제 요청'}
              </Text>
            </Pressable>
            <Pressable className="mt-3 items-center py-2" onPress={() => setDeleteModalVisible(false)}>
              <Text className="font-semibold text-slate-500">취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{children}</View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  showDivider = true,
  accent = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  showDivider?: boolean;
  accent?: 'default' | 'green' | 'violet';
}) {
  const iconColor =
    accent === 'green' ? '#15803d' : accent === 'violet' ? '#7c3aed' : '#475569';

  return (
    <Pressable
      className={`flex-row items-center px-4 py-4 active:bg-slate-50 ${showDivider ? 'border-b border-slate-100' : ''}`}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={iconColor} />
      <View className="ml-3 flex-1">
        <Text className="text-base font-medium text-slate-900">{label}</Text>
        {subtitle ? <Text className="mt-0.5 text-xs text-slate-500">{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </Pressable>
  );
}

function LegalDocumentModal({
  visible,
  title,
  body,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3">
          <Text className="text-lg font-bold text-slate-900">{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>
        <ScrollView className="flex-1 px-4 py-4" contentContainerClassName="pb-8">
          <Text className="text-sm leading-7 text-slate-700">{body}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
