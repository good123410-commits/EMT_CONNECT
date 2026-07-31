import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { ResourceEmailModal } from '@/components/emsCommunity/ResourceEmailModal';
import { getResourceCategoryLabel } from '@/constants/resourceCategories';
import { EMS_LOUNGE } from '@/constants/emsLoungeTheme';
import { formatResourceFileSize } from '@/services/kemixResourceService';
import type { KemixResource } from '@/types/kemixResource';
import { shareResourceOnKakao } from '@/utils/resourceShare';

type ResourceDetailModalProps = {
  resource: KemixResource | null;
  visible: boolean;
  onClose: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR');
}

async function openDownloadUrl(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('연결 불가', '파일 링크를 열 수 없습니다.');
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('연결 실패', '외부 브라우저에서 다시 시도해 주세요.');
  }
}

export function ResourceDetailModal({ resource, visible, onClose }: ResourceDetailModalProps) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!resource) return null;

  const handleKakaoShare = async () => {
    setSharing(true);
    try {
      await shareResourceOnKakao(resource);
    } catch (err) {
      Alert.alert(
        '공유 실패',
        err instanceof Error ? err.message : '카카오톡 공유에 실패했습니다.',
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View className="flex-1" style={{ backgroundColor: EMS_LOUNGE.background }}>
          <View
            className="flex-row items-center justify-between px-4 py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: EMS_LOUNGE.border }}
          >
            <Pressable onPress={onClose} hitSlop={12} className="active:opacity-70">
              <Ionicons name="close" size={26} color={EMS_LOUNGE.textMuted} />
            </Pressable>
            <Text
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: 15,
                color: EMS_LOUNGE.textSecondary,
              }}
            >
              자료 상세
            </Text>
            <View style={{ width: 26 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            <Text
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: 12,
                color: EMS_LOUNGE.accentSoft,
              }}
            >
              {getResourceCategoryLabel(resource.category)}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontFamily: 'Pretendard-Bold',
                fontSize: 20,
                lineHeight: 28,
                color: EMS_LOUNGE.text,
              }}
            >
              {resource.title}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontFamily: 'Pretendard',
                fontSize: 13,
                color: EMS_LOUNGE.textMuted,
              }}
            >
              {formatDate(resource.created_at)} · {resource.file_name} ·{' '}
              {formatResourceFileSize(resource.file_size)}
            </Text>

            {resource.description ? (
              <Text
                style={{
                  marginTop: 16,
                  fontFamily: 'Pretendard',
                  fontSize: 15,
                  lineHeight: 24,
                  color: EMS_LOUNGE.textSecondary,
                }}
              >
                {resource.description}
              </Text>
            ) : null}

            <View className="mt-8 gap-3">
              <Pressable
                className="flex-row items-center justify-center active:opacity-90"
                style={{
                  backgroundColor: EMS_LOUNGE.accent,
                  borderRadius: 12,
                  paddingVertical: 14,
                }}
                onPress={() => void openDownloadUrl(resource.file_url)}
              >
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: 15,
                    color: '#FFFFFF',
                  }}
                >
                  파일 다운로드
                </Text>
              </Pressable>

              <Pressable
                className="flex-row items-center justify-center active:opacity-90"
                style={{
                  backgroundColor: '#FEE500',
                  borderRadius: 12,
                  paddingVertical: 14,
                }}
                disabled={sharing}
                onPress={() => void handleKakaoShare()}
              >
                {sharing ? (
                  <ActivityIndicator color="#3C1E1E" />
                ) : (
                  <>
                    <Text style={{ fontFamily: 'Pretendard-Bold', fontSize: 15, color: '#3C1E1E' }}>
                      💬
                    </Text>
                    <Text
                      style={{
                        marginLeft: 8,
                        fontFamily: 'Pretendard-SemiBold',
                        fontSize: 15,
                        color: '#3C1E1E',
                      }}
                    >
                      카카오톡으로 공유
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                className="flex-row items-center justify-center active:opacity-90"
                style={{
                  backgroundColor: EMS_LOUNGE.surfaceElevated,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: EMS_LOUNGE.border,
                  paddingVertical: 14,
                }}
                onPress={() => setEmailOpen(true)}
              >
                <Ionicons name="mail-outline" size={20} color={EMS_LOUNGE.text} />
                <Text
                  style={{
                    marginLeft: 8,
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: 15,
                    color: EMS_LOUNGE.text,
                  }}
                >
                  이메일로 전송
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <ResourceEmailModal
        resource={resource}
        visible={emailOpen}
        onClose={() => setEmailOpen(false)}
      />
    </>
  );
}
