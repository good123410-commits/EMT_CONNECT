import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LoungePrimaryButton } from '@/components/emsCommunity/loungeUi';
import { useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import { sendResourceByEmail } from '@/services/resourceEmailService';
import { formatResourceFileSize } from '@/services/kemixResourceService';
import type { KemixResource } from '@/types/kemixResource';
import { useAuth } from '@/contexts/AuthContext';

type ResourceEmailModalProps = {
  resource: KemixResource | null;
  visible: boolean;
  onClose: () => void;
};

export function ResourceEmailModal({ resource, visible, onClose }: ResourceEmailModalProps) {
  const { user } = useAuth();
  const { lounge } = useEmsLoungeTheme();
  const [email, setEmail] = useState(user?.email ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSend = async () => {
    if (!resource) return;
    const to = email.trim();
    if (!to) {
      setError('이메일 주소를 입력해 주세요.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await sendResourceByEmail({
        to,
        title: resource.title,
        description: resource.description,
        fileUrl: resource.file_url,
        fileName: resource.file_name,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이메일 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  if (!resource) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        onPress={handleClose}
      >
        <Pressable
          style={{
            backgroundColor: lounge.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 24,
            paddingBottom: 32,
            borderWidth: 1,
            borderColor: lounge.border,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text
            style={{
              fontFamily: 'Pretendard-Bold',
              fontSize: 18,
              color: lounge.text,
            }}
          >
            이메일로 자료 전송
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontFamily: 'Pretendard',
              fontSize: 14,
              lineHeight: 20,
              color: lounge.textSecondary,
            }}
          >
            <Text style={{ fontFamily: 'Pretendard-SemiBold', color: lounge.text }}>
              {resource.title}
            </Text>
            {' '}다운로드 링크를 입력한 이메일로 보내드립니다.
          </Text>

          {success ? (
            <Text
              style={{
                marginTop: 20,
                fontFamily: 'Pretendard-SemiBold',
                fontSize: 14,
                color: lounge.green,
              }}
            >
              이메일이 전송되었습니다.
            </Text>
          ) : (
            <>
              <Text
                style={{
                  marginTop: 20,
                  marginBottom: 6,
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: 12,
                  color: lounge.textMuted,
                }}
              >
                받는 이메일
              </Text>
              <TextInput
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: lounge.border,
                  backgroundColor: lounge.surfaceElevated,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontFamily: 'Pretendard',
                  fontSize: 14,
                  color: lounge.text,
                }}
                value={email}
                onChangeText={setEmail}
                placeholder="example@email.com"
                placeholderTextColor={lounge.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!sending}
              />
              {error ? (
                <Text
                  style={{
                    marginTop: 8,
                    fontFamily: 'Pretendard',
                    fontSize: 13,
                    color: lounge.error,
                  }}
                >
                  {error}
                </Text>
              ) : null}
              <View className="mt-5 gap-3">
                <LoungePrimaryButton
                  label={sending ? '전송 중…' : '이메일 전송'}
                  icon="mail-outline"
                  onPress={() => void handleSend()}
                />
                <Pressable className="items-center py-2 active:opacity-80" onPress={handleClose}>
                  <Text
                    style={{
                      fontFamily: 'Pretendard-SemiBold',
                      fontSize: 14,
                      color: lounge.textMuted,
                    }}
                  >
                    취소
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
