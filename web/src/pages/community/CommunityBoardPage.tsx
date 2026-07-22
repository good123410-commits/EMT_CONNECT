import { useCallback, useEffect, useMemo, useState } from 'react';
import { CommunityPostDetailModal } from '../../components/CommunityPostDetailModal';
import { CommunityWriteModal } from '../../components/CommunityWriteModal';
import { LoginModal } from '../../components/LoginModal';
import { CommunitySubNav } from '../../components/CommunitySubNav';
import { PageHero } from '../../components/PageHero';
import { BOARD_FILTER_TABS, type BoardFilterId } from '../../constants/communityBoard';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchBambooPosts,
  fetchCommunityCategories,
  subscribeCommunityPosts,
} from '../../services/communityService';
import type { CommunityCategory, CommunityPost } from '../../types';

export function CommunityBoardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [activeTab, setActiveTab] = useState<BoardFilterId>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);

  const reload = useCallback(async () => {
    try {
      const [rows, cats] = await Promise.all([fetchBambooPosts(80), fetchCommunityCategories()]);
      setPosts(rows);
      setCategories(cats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const unsubscribe = subscribeCommunityPosts(() => void reload());
    return unsubscribe;
  }, [reload]);

  const activeSlug = BOARD_FILTER_TABS.find((tab) => tab.id === activeTab)?.slug ?? null;

  const filteredPosts = useMemo(() => {
    if (!activeSlug) return posts;
    return posts.filter((post) => post.category_slug === activeSlug);
  }, [posts, activeSlug]);

  const handleWriteClick = () => {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    setWriteOpen(true);
  };

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="KEMIX Community"
        title="자유게시판"
        subtitle="응급의료인들이 모여 경험과 정보를 나누는 따뜻한 커뮤니티 공간입니다"
        dark
      />

      <CommunitySubNav />

      <div className="board-toolbar">
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
        <button type="button" className="btn btn-primary board-write-btn" onClick={handleWriteClick}>
          ✏️ 글쓰기
        </button>
      </div>

      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="board-list" role="list" aria-label="게시글 목록">
        <div className="board-list-head" aria-hidden="true">
          <span className="board-list-col board-list-col--title">제목</span>
          <span className="board-list-col board-list-col--author">글쓴이</span>
        </div>

        {filteredPosts.map((post) => (
          <button
            key={post.id}
            type="button"
            className="board-list-row"
            onClick={() => setSelectedPost(post)}
          >
            <span className="board-list-col board-list-col--title">
              {post.is_notice ? <span className="board-list-badge">공지</span> : null}
              {post.title?.trim() || '제목 없음'}
            </span>
            <span className="board-list-col board-list-col--author">{post.anonymous_label}</span>
          </button>
        ))}
      </div>

      {!loading && filteredPosts.length === 0 ? (
        <div className="board-empty">
          <p>아직 게시글이 없습니다.</p>
          <p className="muted">첫 번째 이야기를 남겨 보세요!</p>
        </div>
      ) : null}

      <CommunityPostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />

      <CommunityWriteModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        categories={categories}
        onSubmitted={() => void reload()}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
