import { useCallback, useEffect, useState } from 'react';
import { LoginModal } from '../../components/LoginModal';
import { CommunitySubNav } from '../../components/CommunitySubNav';
import { PageHero } from '../../components/PageHero';
import { PollCard, PollCreateCard } from '../../components/polls/PollCard';
import { PollDetailModal } from '../../components/polls/PollDetailModal';
import {
  EMPTY_POLL_FORM,
  PollWriteModal,
  pollToForm,
  type PollFormState,
} from '../../components/polls/PollWriteModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  adminClosePoll,
  adminDeletePoll,
  adminListPolls,
  adminUpsertPoll,
} from '../../services/adminService';
import { fetchPublishedPolls } from '../../services/pollService';
import type { Poll } from '../../types';

export function PollsPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [writeForm, setWriteForm] = useState<PollFormState>(EMPTY_POLL_FORM);

  const reload = useCallback(async () => {
    try {
      const rows = isAdmin ? await adminListPolls() : await fetchPublishedPolls();
      setPolls(rows.filter((poll) => isAdmin || poll.is_published));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '투표 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openCreate = () => {
    setEditingPoll(null);
    setWriteForm(EMPTY_POLL_FORM);
    setWriteOpen(true);
  };

  const openEdit = (poll: Poll) => {
    setEditingPoll(poll);
    setWriteForm(pollToForm(poll));
    setWriteOpen(true);
    setDetailOpen(false);
  };

  const handleSave = async (form: PollFormState) => {
    const options = form.options
      .map((opt, index) => ({ ...opt, label: opt.label.trim(), display_order: index }))
      .filter((opt) => opt.label);

    if (!form.title.trim()) {
      showToast('제목을 입력해 주세요.', 'error');
      return;
    }
    if (options.length < 2) {
      showToast('투표 항목은 2개 이상 필요합니다.', 'error');
      return;
    }

    setSaving(true);
    try {
      await adminUpsertPoll({
        id: editingPoll?.id,
        title: form.title.trim(),
        description: form.description.trim(),
        is_published: form.is_published,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        display_order: form.display_order,
        options,
      });
      showToast(editingPoll ? '투표 안건이 수정되었습니다.' : '투표 안건이 생성되었습니다.');
      setWriteOpen(false);
      setEditingPoll(null);
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (poll: Poll) => {
    if (!window.confirm(`"${poll.title}" 투표를 삭제하시겠습니까?`)) return;
    try {
      await adminDeletePoll(poll.id);
      showToast('삭제되었습니다.');
      if (selectedPoll?.id === poll.id) {
        setDetailOpen(false);
        setSelectedPoll(null);
      }
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  const handleClosePoll = async (poll: Poll) => {
    if (!window.confirm(`"${poll.title}" 투표를 마감하시겠습니까?`)) return;
    try {
      const updated = await adminClosePoll(poll.id, true);
      showToast('투표가 마감되었습니다.');
      setSelectedPoll(updated);
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '마감 실패', 'error');
    }
  };

  const handleOpenPoll = (poll: Poll) => {
    setSelectedPoll(poll);
    setDetailOpen(true);
  };

  const handlePollUpdated = (poll: Poll) => {
    setSelectedPoll(poll);
    setPolls((prev) => prev.map((row) => (row.id === poll.id ? poll : row)));
  };

  const visiblePolls = polls.filter((poll) => poll.is_published || isAdmin);

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="KEMIX Community"
        title="KEMIX 투표"
        subtitle="응급의료 커뮤니티의 의견을 모으는 투표 공간입니다"
        dark
      />

      <CommunitySubNav />

      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="poll-grid">
        {isAdmin ? <PollCreateCard onClick={openCreate} /> : null}
        {visiblePolls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            isAdmin={isAdmin}
            onOpen={handleOpenPoll}
            onEdit={openEdit}
            onDelete={(p) => void handleDelete(p)}
            onClosePoll={(p) => void handleClosePoll(p)}
          />
        ))}
      </div>

      {!loading && visiblePolls.length === 0 && !isAdmin ? (
        <p className="muted">진행 중인 투표가 없습니다.</p>
      ) : null}

      <PollWriteModal
        open={writeOpen}
        initial={writeForm}
        saving={saving}
        onClose={() => {
          setWriteOpen(false);
          setEditingPoll(null);
        }}
        onSave={(form) => void handleSave(form)}
      />

      <PollDetailModal
        poll={selectedPoll}
        open={detailOpen}
        isAdmin={isAdmin}
        onClose={() => setDetailOpen(false)}
        onUpdated={handlePollUpdated}
        onEdit={openEdit}
        onDelete={(p) => void handleDelete(p)}
        onClosePoll={(p) => void handleClosePoll(p)}
        onLoginRequired={() => setLoginOpen(true)}
      />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
