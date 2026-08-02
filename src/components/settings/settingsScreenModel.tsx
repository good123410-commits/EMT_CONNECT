import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { ProfileEditSheet } from '@/components/settings/ProfileEditSheet';
import { SettingsDonationModal } from '@/components/settings/SettingsDonationModal';
import { SettingsAdminPortalModal } from '@/components/settings/SettingsAdminPortalModal';
import { SettingsParamedicPortalModal } from '@/components/settings/SettingsParamedicPortalModal';
import { SettingsRow, SettingsSection } from '@/components/settings/settingsUi';
import { useAuth } from '@/contexts/AuthContext';
import { openAuthScreen } from '@/navigation/rootNavigation';
import { OFFICIAL_WEBSITE_URL } from '@/services/siteSettingsService';

const LOCATION_CONSENT_KEY = 'ems_connect_location_consent_v1';

type LegalModalKind = 'privacy' | 'terms' | 'location' | 'servicePolicy' | null;

export type SettingsScreenState = {
  user: ReturnType<typeof useAuth>['user'];
  profile: ReturnType<typeof useAuth>['profile'];
  locationConsent: boolean;
  legalModal: LegalModalKind;
  deleteModalVisible: boolean;
  deleteSubmitting: boolean;
  paramedicPortalVisible: boolean;
  adminPortalVisible: boolean;
  donationModalVisible: boolean;
  profileEditVisible: boolean;
  handleLocationConsentChange: (next: boolean) => Promise<void>;
  handleDeleteAccountRequest: () => Promise<void>;
  handleOpenOfficialWebsite: () => Promise<void>;
  handleSignOut: () => void;
  setLegalModal: (value: LegalModalKind) => void;
  setDeleteModalVisible: (value: boolean) => void;
  setParamedicPortalVisible: (value: boolean) => void;
  setAdminPortalVisible: (value: boolean) => void;
  setDonationModalVisible: (value: boolean) => void;
  setProfileEditVisible: (value: boolean) => void;
};

const SettingsScreenContext = createContext<SettingsScreenState | null>(null);

function useSettingsScreenState(): SettingsScreenState {
  const { user, profile, signOut } = useAuth();
  const [locationConsent, setLocationConsent] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalKind>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [paramedicPortalVisible, setParamedicPortalVisible] = useState(false);
  const [adminPortalVisible, setAdminPortalVisible] = useState(false);
  const [donationModalVisible, setDonationModalVisible] = useState(false);
  const [profileEditVisible, setProfileEditVisible] = useState(false);

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

  const handleDeleteAccountRequest = useCallback(async () => {
    setDeleteSubmitting(true);
    try {
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
  }, [signOut, user]);

  const handleOpenOfficialWebsite = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(OFFICIAL_WEBSITE_URL);
      if (!supported) {
        Alert.alert('연결 불가', '웹사이트 링크를 열 수 없습니다.');
        return;
      }
      await Linking.openURL(OFFICIAL_WEBSITE_URL);
    } catch (error) {
      Alert.alert(
        '연결 실패',
        error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      );
    }
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => void signOut() },
    ]);
  }, [signOut]);

  return useMemo(
    () => ({
      user,
      profile,
      locationConsent,
      legalModal,
      deleteModalVisible,
      deleteSubmitting,
      paramedicPortalVisible,
      adminPortalVisible,
      donationModalVisible,
      profileEditVisible,
      handleLocationConsentChange,
      handleDeleteAccountRequest,
      handleOpenOfficialWebsite,
      handleSignOut,
      setLegalModal,
      setDeleteModalVisible,
      setParamedicPortalVisible,
      setAdminPortalVisible,
      setDonationModalVisible,
      setProfileEditVisible,
    }),
    [
      user,
      profile,
      locationConsent,
      legalModal,
      deleteModalVisible,
      deleteSubmitting,
      paramedicPortalVisible,
      adminPortalVisible,
      donationModalVisible,
      profileEditVisible,
      handleLocationConsentChange,
      handleDeleteAccountRequest,
      handleOpenOfficialWebsite,
      handleSignOut,
    ],
  );
}

export function SettingsScreenProvider({ children }: { children: ReactNode }) {
  const value = useSettingsScreenState();
  return <SettingsScreenContext.Provider value={value}>{children}</SettingsScreenContext.Provider>;
}

export function useSettingsScreen(): SettingsScreenState {
  const ctx = useContext(SettingsScreenContext);
  if (!ctx) {
    throw new Error('useSettingsScreen must be used within SettingsScreenProvider');
  }
  return ctx;
}

type SettingsScrollBodyProps = {
  embedded?: boolean;
};

export function SettingsScrollBody({ embedded = false }: SettingsScrollBodyProps) {
  const {
    user,
    profile,
    locationConsent,
    handleLocationConsentChange,
    handleOpenOfficialWebsite,
    handleSignOut,
    setLegalModal,
    setDeleteModalVisible,
    setParamedicPortalVisible,
    setAdminPortalVisible,
    setDonationModalVisible,
    setProfileEditVisible,
  } = useSettingsScreen();

  const contentPaddingBottom = embedded ? 24 : 32;
  const displayName = profile?.name?.trim() || user?.email?.trim() || '로그인됨';

  return (
    <ScrollView
      style={embedded ? styles.embeddedScroll : styles.fullScreenScroll}
      contentContainerStyle={{
        paddingHorizontal: embedded ? 20 : 32,
        paddingTop: embedded ? 8 : 16,
        paddingBottom: contentPaddingBottom,
        gap: 20,
      }}
      showsVerticalScrollIndicator={embedded}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {user ? (
        <Text className="text-sm font-medium text-kemix-text">{displayName}</Text>
      ) : (
        <Text className="text-sm text-kemix-muted">게스트로 둘러보는 중</Text>
      )}

      <SettingsSection title="계정">
        {user ? (
          <>
            <SettingsRow
              icon="person-circle-outline"
              label="개인정보 수정"
              subtitle="별명 · 전화번호 · 비밀번호"
              onPress={() => setProfileEditVisible(true)}
            />
            <SettingsRow
              icon="log-out-outline"
              label="로그아웃"
              onPress={handleSignOut}
              showDivider={false}
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </SettingsSection>

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
              <Text className="text-base font-semibold text-kemix-text">
                위치기반서비스 이용동의
              </Text>
              <Text className="mt-1 text-xs leading-5 text-kemix-text-secondary">
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

      <SettingsSection title="서비스 안내">
        <SettingsRow
          icon="globe-outline"
          label="공식 웹사이트"
          onPress={() => void handleOpenOfficialWebsite()}
        />
        <SettingsRow
          icon="heart-outline"
          label="후원하기"
          subtitle="후원 계좌 및 안내"
          onPress={() => setDonationModalVisible(true)}
        />
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
          label="EMS 인증 · 전용 공간"
          subtitle="자격증 제출 · EMS 커뮤니티"
          onPress={() => setParamedicPortalVisible(true)}
          accent="green"
        />
        <SettingsRow
          icon="key-outline"
          label="관리자 모드"
          subtitle="운영 대시보드 · 구급대원 공간"
          onPress={() => setAdminPortalVisible(true)}
          accent="violet"
          showDivider={false}
        />
      </SettingsSection>

      <View className="overflow-hidden rounded-2xl border border-red-200 bg-kemix-surface">
        <Pressable
          className="flex-row items-center gap-3 px-4 py-4 active:bg-red-50"
          onPress={() => setDeleteModalVisible(true)}
        >
          <Ionicons name="trash-outline" size={22} color="#dc2626" />
          <View className="flex-1">
            <Text className="text-base font-bold text-red-600">회원 탈퇴 및 데이터 삭제 요청</Text>
            <Text className="mt-1 text-xs text-kemix-text-secondary">
              Google Play 정책에 따라 계정·개인정보 삭제를 요청할 수 있습니다.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fca5a5" />
        </Pressable>
      </View>

      <Text className="text-center text-xs text-kemix-muted">EMS Connect v1.0.0</Text>
    </ScrollView>
  );
}

export function SettingsAttachedModals() {
  const {
    user,
    legalModal,
    deleteModalVisible,
    deleteSubmitting,
    paramedicPortalVisible,
    adminPortalVisible,
    donationModalVisible,
    profileEditVisible,
    setLegalModal,
    setDeleteModalVisible,
    setParamedicPortalVisible,
    setAdminPortalVisible,
    setDonationModalVisible,
    setProfileEditVisible,
    handleDeleteAccountRequest,
  } = useSettingsScreen();

  return (
    <>
      {legalModal === 'privacy' ? (
        <LegalDocumentModal
          visible
          title="개인정보 처리방침"
          body={PRIVACY_POLICY_TEXT}
          onClose={() => setLegalModal(null)}
        />
      ) : null}
      {legalModal === 'terms' ? (
        <LegalDocumentModal
          visible
          title="서비스 이용약관"
          body={TERMS_OF_SERVICE_TEXT}
          onClose={() => setLegalModal(null)}
        />
      ) : null}
      {legalModal === 'location' ? (
        <LegalDocumentModal
          visible
          title="위치기반서비스 이용동의"
          body={LOCATION_CONSENT_TEXT}
          onClose={() => setLegalModal(null)}
        />
      ) : null}
      {legalModal === 'servicePolicy' ? (
        <ServicePolicyModal visible onClose={() => setLegalModal(null)} />
      ) : null}
      {paramedicPortalVisible ? (
        <SettingsParamedicPortalModal
          visible
          onClose={() => setParamedicPortalVisible(false)}
        />
      ) : null}
      {adminPortalVisible ? (
        <SettingsAdminPortalModal visible onClose={() => setAdminPortalVisible(false)} />
      ) : null}
      {donationModalVisible ? (
        <SettingsDonationModal visible onClose={() => setDonationModalVisible(false)} />
      ) : null}
      {profileEditVisible && user ? (
        <ProfileEditSheet visible onClose={() => setProfileEditVisible(false)} />
      ) : null}
      {deleteModalVisible ? (
        <DeleteAccountSheet
          visible
          deleteSubmitting={deleteSubmitting}
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={() => void handleDeleteAccountRequest()}
        />
      ) : null}
    </>
  );
}

function DeleteAccountSheet({
  visible,
  deleteSubmitting,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  deleteSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/45">
        <View className="rounded-t-3xl bg-kemix-surface px-5 pb-8 pt-4">
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full bg-kemix-elevated" />
          </View>
          <Text className="text-lg font-bold text-kemix-text">회원 탈퇴 및 데이터 삭제</Text>
          <Text className="mt-3 text-sm leading-6 text-kemix-text-secondary">
            탈퇴 시 계정 정보, 프로필, 포인트·리워드 기록(해당 시)이 삭제 요청됩니다.{'\n\n'}
            · 처리 기간: 영업일 기준 최대 7일{'\n'}
            · 삭제 후 동일 이메일 재가입 가능{'\n'}
            · 법령상 보관 의무가 있는 정보는 해당 기간 보관 후 파기
          </Text>
          <Pressable
            className={`mt-6 items-center rounded-xl py-3.5 ${deleteSubmitting ? 'bg-red-300' : 'bg-red-600'}`}
            disabled={deleteSubmitting}
            onPress={onConfirm}
          >
            <Text className="font-bold text-white">
              {deleteSubmitting ? '처리 중...' : '탈퇴 및 삭제 요청'}
            </Text>
          </Pressable>
          <Pressable className="mt-3 items-center py-2" onPress={onClose}>
            <Text className="font-semibold text-kemix-text-secondary">취소</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
  if (!visible) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-kemix-surface">
        <View className="flex-row items-center justify-between border-b border-kemix-border px-4 py-3">
          <Text className="text-lg font-bold text-kemix-text">{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>
        <ScrollView className="flex-1 px-4 py-4" contentContainerClassName="pb-8">
          <Text className="text-sm leading-7 text-kemix-text">{body}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  embeddedScroll: {
    flex: 1,
    minHeight: 0,
  },
  fullScreenScroll: {
    flex: 1,
  },
});
