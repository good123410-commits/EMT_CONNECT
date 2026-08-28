import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ActivityIndicator, Alert, Linking, Modal, ScrollView, Text, View } from 'react-native';
import { ResourceEmailModal } from '@/components/emsCommunity/ResourceEmailModal';
import { CommunityCommentSection } from '@/components/emsCommunity/CommunityCommentSection';
import { LoungeBackBar } from '@/components/emsCommunity/loungeUi';
import { getResourceCategoryLabel } from '@/constants/resourceCategories';
import { EMS_LOUNGE_SPACING, useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
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
  const { lounge } = useEmsLoungeTheme();
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
        <View className="flex-1" style={{ backgroundColor: lounge.background }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <LoungeBackBar label="목록" onPress={onClose} />

            <View style={{ paddingHorizontal: EMS_LOUNGE_SPACING.screen }}>
            <Text
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: 12,
                color: lounge.accentSoft,
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
                color: lounge.text,
              }}
            >
              {resource.title}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontFamily: 'Pretendard',
                fontSize: 13,
                color: lounge.textMuted,
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
                  color: lounge.textSecondary,
                }}
              >
                {resource.description}
              </Text>
            ) : null}

            <View className="mt-8 gap-3">
              <Pressable
                className="flex-row items-center justify-center active:opacity-90"
                style={{
                  backgroundColor: lounge.accent,
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
                  backgroundColor: lounge.surfaceElevated,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: lounge.border,
                  paddingVertical: 14,
                }}
                onPress={() => setEmailOpen(true)}
              >
                <Ionicons name="mail-outline" size={20} color={lounge.text} />
                <Text
                  style={{
                    marginLeft: 8,
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: 15,
                    color: lounge.text,
                  }}
                >
                  이메일로 전송
                </Text>
              </Pressable>
            </View>

            <CommunityCommentSection
              enabled={false}
              postId={null}
              disabledMessage="자료실 항목은 파일 공유·다운로드 중심입니다. 문의는 질문함을 이용해 주세요."
            />
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
