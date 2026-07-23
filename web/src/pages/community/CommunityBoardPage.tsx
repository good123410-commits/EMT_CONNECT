import { useCallback, useEffect, useMemo, useState } from 'react';
import { CommunityPostDetailModal } from '../../components/CommunityPostDetailModal';
import { CommunityWriteModal } from '../../components/CommunityWriteModal';
import { GuestLoginPrompt } from '../../components/GuestLoginPrompt';
import { CommunitySubNav } from '../../components/CommunitySubNav';
import { Pagination } from '../../components/Pagination';
import { PageHero } from '../../components/PageHero';
import { BOARD_FILTER_TABS, BOARD_PAGE_SIZE, type BoardFilterId } from '../../constants/communityBoard';
import { useAuth } from '../../contexts/AuthContext';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import {
  fetchBambooPostsPage,
  fetchCommunityCategories,
  fetchDailyBestPosts,
  subscribeCommunityPosts,
} from '../../services/communityService';
import type { CommunityPost } from '../../types';
import { resetScrollPosition } from '../../utils/scrollToTop';
import { consumeAuthIntent } from '../../utils/authIntent';
import { buildCommunityPreview } from '../../utils/communityContent';

type CommunityBoardPageProps = {
  mode?: 'board' | 'qna';
  heroTitle?: string;
  heroSubtitle?: string;
  writeLabel?: string;
};

export function CommunityBoardPage({
  mode = 'board',
  heroTitle = '자유게시판',
  heroSubtitle = '응급의료인들이 모여 경험과 정보를 나누는 따뜻한 커뮤니티 공간입니다',
  writeLabel = '글쓰기',
}: CommunityBoardPageProps = {}) {
  const isQnaMode = mode === 'qna';
  const { user, loading: authLoading } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof fetchCommunityCategories>>>([]);
  const [activeTab, setActiveTab] = useState<BoardFilterId>(isQnaMode ? 'question' : 'all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);

  const isDailyBest = !isQnaMode && activeTab === 'daily-best';
  const activeSlug = isQnaMode
    ? 'question'
    : (BOARD_FILTER_TABS.find((tab) => tab.id === activeTab)?.slug ?? null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const cats = await fetchCommunityCategories();
      setCategories(cats);

      if (isDailyBest) {
        const best = await fetchDailyBestPosts(10);
        setPosts(best);
        setTotalCount(best.length);
      } else {
        const result = await fetchBambooPostsPage(page, BOARD_PAGE_SIZE, activeSlug);
        setPosts(result.posts);
        setTotalCount(result.totalCount);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeSlug, isDailyBest, page]);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribeCommunityPosts(() => void reload());
    return unsubscribe;
  }, [reload]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useScrollToTop([activeTab]);
  useScrollToTop([page]);

  const totalPages = useMemo(() => {
    if (isDailyBest) return 1;
    return Math.max(1, Math.ceil(totalCount / BOARD_PAGE_SIZE));
  }, [isDailyBest, totalCount]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    requestAnimationFrame(() => {
      resetScrollPosition({ behavior: 'instant' });
    });
  };

  const handlePostUpdate = (postId: string, patch: Partial<CommunityPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
    setSelectedPost((prev) => (prev?.id === postId ? { ...prev, ...patch } : prev));
  };

  const handleWriteClick = () => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    setWriteOpen(true);
  };

  useEffect(() => {
    if (authLoading || !user) return;
    const intent = consumeAuthIntent();
    if (intent?.type === 'community-write') {
      setWriteOpen(true);
    }
  }, [authLoading, user]);

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="KEMIX Community"
        title={heroTitle}
        subtitle={heroSubtitle}
        dark
      />

      <CommunitySubNav />

      <div className="board-toolbar">
        {!isQnaMode ? (
          <nav className="board-tabs" aria-label="게시판 카테고리">
            {BOARD_FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`board-tab${activeTab === tab.id ? ' board-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        ) : (
          <p className="board-qna-mode-label">질문&답변 게시판</p>
        )}
        <button type="button" className="btn btn-primary board-write-btn" onClick={handleWriteClick}>
          ✏️ {writeLabel}
        </button>
      </div>

      {isDailyBest ? (
        <p className="board-daily-best-desc">최근 24시간 동안 좋아요를 가장 많이 받은 게시글 TOP 10</p>
      ) : null}

      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="board-list" role="list" aria-label="게시글 목록">
        <div className="board-list-head" aria-hidden="true">
          <span className="board-list-col board-list-col--title">제목</span>
          <span className="board-list-col board-list-col--meta">반응</span>
          <span className="board-list-col board-list-col--author">글쓴이</span>
        </div>

        {posts.map((post) => (
          <button
            key={post.id}
            type="button"
            className="board-list-row"
            onClick={() => setSelectedPost(post)}
          >
            <span className="board-list-col board-list-col--title">
              {post.is_notice ? <span className="board-list-badge">공지</span> : null}
              {isDailyBest ? <span className="board-hot">🔥</span> : null}
              {post.title?.trim() || '제목 없음'}
              {post.summary || post.content ? (
                <span className="board-list-preview">
                  {buildCommunityPreview(post.content, post.summary)}
                </span>
              ) : null}
            </span>
            <span className="board-list-col board-list-col--meta">
              👍 {post.likes}
              {post.dislikes ? ` · 👎 ${post.dislikes}` : ''}
              {post.comment_count ? ` · 💬 ${post.comment_count}` : ''}
            </span>
            <span className="board-list-col board-list-col--author">{post.anonymous_label}</span>
          </button>
        ))}
      </div>

      {!loading && posts.length === 0 ? (
        <div className="board-empty">
          <p>아직 게시글이 없습니다.</p>
          <p className="muted">첫 번째 이야기를 남겨 보세요!</p>
        </div>
      ) : null}

      {!isDailyBest ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      ) : null}

      <CommunityPostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onPostUpdate={handlePostUpdate}
        onLoginRequired={() => setLoginOpen(true)}
      />

      <CommunityWriteModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        categories={categories}
        defaultCategorySlug={isQnaMode ? 'question' : undefined}
        onSubmitted={() => void reload()}
      />
      <GuestLoginPrompt
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        title="로그인이 필요합니다"
        description="질문을 남기시려면 로그인이 필요합니다."
        kakaoLabel="카카오로 시작하기"
        googleLabel="Google로 시작하기"
        returnPath={isQnaMode ? '/community/qna' : '/community/board'}
        intent={{ type: 'community-write' }}
      />
    </div>
  );
}
