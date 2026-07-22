import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  adminClosePoll,
  adminDeletePoll,
  adminListPolls,
  adminUpsertPoll,
} from '../../services/adminService';
import { formatPollEndsAt, getPollStatusLabel } from '../../services/pollService';
import type { Poll } from '../../types';
import {
  EMPTY_POLL_FORM,
  PollWriteModal,
  pollToForm,
  type PollFormState,
} from '../../components/polls/PollWriteModal';

export function AdminPollsPanel() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [writeForm, setWriteForm] = useState<PollFormState>(EMPTY_POLL_FORM);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await adminListPolls());
    } catch (err) {
      showToast(err instanceof Error ? err.message : '불러오기 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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
      showToast(editingPoll ? '수정되었습니다.' : '등록되었습니다.');
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
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  const handleClosePoll = async (poll: Poll) => {
    try {
      await adminClosePoll(poll.id, true);
      showToast('마감되었습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '마감 실패', 'error');
    }
  };

  return (
    <section className="admin-panel">
      <h2>KEMIX 투표 관리</h2>
      <p className="muted">
        사용자 페이지: <a href="/community/polls" target="_blank" rel="noreferrer">/community/polls</a>
      </p>

      <div className="admin-form-actions" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + 새 투표 안건
        </button>
      </div>

      {loading ? <p className="muted">불러오는 중…</p> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>상태</th>
              <th>항목</th>
              <th>총 투표</th>
              <th>종료일</th>
              <th>공개</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((poll) => (
              <tr key={poll.id}>
                <td>{poll.title}</td>
                <td>{getPollStatusLabel(poll)}</td>
                <td>{poll.options.length}</td>
                <td>{poll.total_votes ?? 0}</td>
                <td>{formatPollEndsAt(poll.ends_at)}</td>
                <td>{poll.is_published ? '공개' : '비공개'}</td>
                <td className="admin-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(poll)}>
                    수정
                  </button>
                  {!poll.is_closed ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleClosePoll(poll)}>
                      마감
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleDelete(poll)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && rows.length === 0 ? <p className="muted">등록된 투표가 없습니다.</p> : null}

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
    </section>
  );
}
