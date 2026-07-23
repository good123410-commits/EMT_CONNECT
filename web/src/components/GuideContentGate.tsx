import { useAuth } from '../contexts/AuthContext';
import {
  getGuidePreviewText,
  renderGuideContent,
  renderGuidePreview,
} from '../utils/guideContent';
import { GuestLoginPrompt } from './GuestLoginPrompt';

type GuideContentGateProps = {
  slug: string;
  content: string;
  summary?: string | null;
};

export function GuideContentGate({ slug, content, summary }: GuideContentGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="muted">본문을 불러오는 중…</p>;
  }

  if (user) {
    return <>{renderGuideContent(content)}</>;
  }

  const previewText = getGuidePreviewText(content, summary);
  const returnPath =
    typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : `/blog/${slug}`;

  return (
    <div className="guide-detail-gate-wrap">
      <section className="guide-detail-preview" aria-label="가이드 미리보기">
        {renderGuidePreview(previewText)}
      </section>

      <section className="guide-detail-gated" aria-label="로그인 후 전체 가이드">
        <div className="guide-detail-gated-blur" aria-hidden>
          {renderGuideContent(content)}
        </div>
        <div className="guide-detail-gate-panel">
          <GuestLoginPrompt
            presentation="inline"
            title="전체 가이드 열람"
            description="3초 간편 로그인 후 전체 응급처치 가이드를 확인하세요"
            kakaoLabel="카카오 3초 로그인"
            googleLabel="구글 로그인"
            returnPath={returnPath}
            intent={{ type: 'guide-unlock', slug }}
          />
        </div>
      </section>
    </div>
  );
}
