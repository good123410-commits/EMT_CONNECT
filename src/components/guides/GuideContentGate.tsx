import { StyleSheet, Text, View } from 'react-native';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { GuideHtmlContent } from '@/components/guides/GuideHtmlContent';
import { useAuth } from '@/contexts/AuthContext';
import { getGuidePreviewText } from '@/utils/guidePreview';

type GuideContentGateProps = {
  slug: string;
  content: string;
  summary?: string | null;
};

const BLUR_TEASER_MAX_HEIGHT = 220;

export function GuideContentGate({ slug, content, summary }: GuideContentGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Text className="text-sm text-slate-500">본문을 불러오는 중…</Text>;
  }

  if (user) {
    return <GuideHtmlContent content={content} />;
  }

  const previewText = getGuidePreviewText(content, summary);
  const authIntent = { type: 'guide-unlock' as const, slug };

  return (
    <View>
      <View className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <Text className="text-sm leading-7 text-slate-700">{previewText}</Text>
      </View>

      <View style={styles.blurTeaser} className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
        <View style={styles.blurTeaserInner} pointerEvents="none">
          <GuideHtmlContent content={content} />
        </View>
      </View>

      <View className="mt-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <Text className="text-center text-base font-bold text-slate-900">전체 가이드 열람</Text>
        <Text className="mt-2 text-center text-sm leading-6 text-slate-600">
          3초 간편 로그인 후 전체 응급처치 가이드를 확인하세요
        </Text>

        <View className="mt-4">
          <SocialLoginButtons
            intent={authIntent}
            kakaoLabel="카카오 3초 로그인"
            googleLabel="구글 로그인"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurTeaser: {
    maxHeight: BLUR_TEASER_MAX_HEIGHT,
  },
  blurTeaserInner: {
    opacity: 0.35,
  },
});
