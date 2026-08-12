import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { APP_RADIUS } from '@/constants/appTheme';
import { useThemedColors } from '@/hooks/useThemedColors';
import { useAuth } from '@/contexts/AuthContext';
import {
  changeAccountPassword,
  updateAccountNickname,
  updateAccountPhone,
  userHasEmailPasswordAuth,
} from '@/services/accountProfileService';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ProfileEditSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemedColors();
  const { user, profile, refreshProfile } = useAuth();

  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const canChangePassword = userHasEmailPasswordAuth(user?.identities);

  useEffect(() => {
    if (!visible) return;
    setNickname(profile?.name ?? user?.user_metadata?.name ?? '');
    setPhone(profile?.phone ?? user?.user_metadata?.phone ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [visible, profile?.name, profile?.phone, user?.user_metadata?.name, user?.user_metadata?.phone]);

  const handleSaveNickname = async () => {
    if (!user) return;
    setSavingNickname(true);
    try {
      await updateAccountNickname(user.id, nickname);
      await refreshProfile();
      Alert.alert('저장 완료', '별명이 변경되었습니다.');
    } catch (error) {
      Alert.alert(
        '저장 실패',
        error instanceof Error ? error.message : '별명 변경에 실패했습니다.',
      );
    } finally {
      setSavingNickname(false);
    }
  };

  const handleSavePhone = async () => {
    if (!user) return;
    setSavingPhone(true);
    try {
      await updateAccountPhone(user.id, phone);
      await refreshProfile();
      Alert.alert('저장 완료', '전화번호가 변경되었습니다.');
    } catch (error) {
      Alert.alert(
        '저장 실패',
        error instanceof Error ? error.message : '전화번호 변경에 실패했습니다.',
      );
    } finally {
      setSavingPhone(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    if (newPassword !== confirmPassword) {
      Alert.alert('입력 오류', '새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setSavingPassword(true);
    try {
      await changeAccountPassword(user.email, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('변경 완료', '비밀번호가 변경되었습니다.');
    } catch (error) {
      Alert.alert(
        '변경 실패',
        error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.',
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (!visible || !user) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기" />
        <View
          className="bg-kemix-surface"
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View className="flex-row items-center justify-between border-b border-kemix-border px-5 py-4">
            <Text className="text-[17px] font-bold text-kemix-text">개인정보 수정</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
              style={{ backgroundColor: colors.blueLight }}
              onPress={onClose}
              hitSlop={8}
            >
              <AppIcon name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            className="px-5 pt-4"
            contentContainerStyle={{ paddingBottom: 24, gap: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="rounded-2xl border border-kemix-border bg-kemix-bg px-4 py-3">
              <Text className="text-xs font-semibold text-kemix-muted">로그인 이메일</Text>
              <Text className="mt-1 text-sm text-kemix-text">{user.email ?? ''}</Text>
            </View>

            <ProfileFieldSection title="별명(닉네임)">
              <TextInput
                className="rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text"
                value={nickname}
                onChangeText={setNickname}
                placeholder="사용할 별명"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
              <SaveButton
                label="별명 저장"
                loading={savingNickname}
                onPress={() => void handleSaveNickname()}
              />
            </ProfileFieldSection>

            <ProfileFieldSection title="전화번호">
              <TextInput
                className="rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text"
                value={phone}
                onChangeText={setPhone}
                placeholder="010-0000-0000"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
              <SaveButton
                label="전화번호 저장"
                loading={savingPhone}
                onPress={() => void handleSavePhone()}
              />
            </ProfileFieldSection>

            <ProfileFieldSection title="비밀번호 변경">
              {canChangePassword ? (
                <>
                  <TextInput
                    className="rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="현재 비밀번호"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    className="mt-3 rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="새 비밀번호 (8자 이상)"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    className="mt-3 rounded-xl border border-kemix-border bg-kemix-bg px-4 py-3 text-base text-kemix-text"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="새 비밀번호 확인"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <SaveButton
                    label="비밀번호 변경"
                    loading={savingPassword}
                    onPress={() => void handleChangePassword()}
                  />
                </>
              ) : (
                <View className="flex-row items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                  <Ionicons name="information-circle-outline" size={18} color="#b45309" />
                  <Text className="flex-1 text-sm leading-5 text-amber-900">
                    소셜 로그인 계정은 앱에서 비밀번호를 변경할 수 없습니다. 연동된 서비스에서
                    비밀번호를 관리해 주세요.
                  </Text>
                </View>
              )}
            </ProfileFieldSection>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ProfileFieldSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="mb-2 text-sm font-bold text-kemix-text">{title}</Text>
      {children}
    </View>
  );
}

function SaveButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`mt-3 items-center rounded-xl py-3.5 ${loading ? 'bg-blue-300' : 'bg-blue-600 active:bg-blue-700'}`}
      disabled={loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="font-bold text-white">{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: APP_RADIUS.cardLg,
    borderTopRightRadius: APP_RADIUS.cardLg,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
  },
});
