import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  submitCommunityReport,
  type CommunityReportInput,
} from '@/services/paramedicCommunityService';

type ReportContentButtonProps = {
  contentId: string;
  contentType: CommunityReportInput['contentType'];
  preview: string;
  compact?: boolean;
};

export function ReportContentButton({
  contentId,
  contentType,
  preview,
  compact = false,
}: ReportContentButtonProps) {
  const { user } = useAuth();

  const handleReport = () => {
    Alert.alert(
      '신고하기',
      '욕설·비방·개인정보 노출·허위 정보 등 운영 정책 위반 게시물을 신고합니다. 운영팀이 검토합니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '신고',
          style: 'destructive',
          onPress: () => {
            void submitCommunityReport({
              reporterId: user?.id ?? 'anonymous',
              contentId,
              contentType,
              preview,
            });
            Alert.alert('접수 완료', '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
          },
        },
      ],
    );
  };

  return (
    <Pressable className="flex-row items-center" onPress={handleReport} hitSlop={8}>
      <Ionicons name="flag-outline" size={compact ? 14 : 16} color="#94a3b8" />
      {!compact ? <Text className="ml-1 text-xs text-slate-400">신고</Text> : null}
    </Pressable>
  );
}
