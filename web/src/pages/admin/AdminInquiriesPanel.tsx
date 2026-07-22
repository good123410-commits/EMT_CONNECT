import { useCallback, useEffect, useState } from 'react';
import { InquiryAnswerModal } from '../../components/InquiryAnswerModal';
import { useToast } from '../../contexts/ToastContext';
import {
  adminAnswerInquiry,
  adminDeleteInquiry,
  adminListInquiries,
  inquiryStatusLabel,
} from '../../services/inquiryService';
import type { KemixInquiry } from '../../types';

export function AdminInquiriesPanel() {
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState<KemixInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<KemixInquiry | null>(null);

  const reload = useCallback(async () => {
    try {
      const rows = await adminListInquiries();
      setInquiries(rows);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '불러오기 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openAnswer = (row: KemixInquiry) => setSelected(row);
  const closeAnswer = () => setSelected(null);

  const saveAnswer = async (answer: string) => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminAnswerInquiry(selected.id, answer);
      showToast('답변이 저장되었습니다.');
      closeAnswer();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteInquiry = async (id: string) => {
    if (!window.confirm('문의를 삭제하시겠습니까?')) return;
    try {
      await adminDeleteInquiry(id);
      showToast('문의가 삭제되었습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <section className="admin-panel">
      <h2>1:1 문의(Q&A) 관리</h2>
      <p className="admin-panel-desc">
        웹 1:1 문의는 작성자와 관리자만 열람할 수 있습니다. 답변 저장 시 상태가 자동으로 답변 완료로 변경됩니다.
      </p>

      {loading ? <p className="muted">불러오는 중…</p> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>상태</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length === 0 && !loading ? (
              <tr>
                <td colSpan={4} className="muted">
                  접수된 1:1 문의가 없습니다.
                </td>
              </tr>
            ) : null}
            {inquiries.map((row) => (
              <tr key={row.id}>
                <td>
                  <button
                    type="button"
                    className="admin-link-btn"
                    onClick={() => openAnswer(row)}
                  >
                    {row.title}
                  </button>
                </td>
                <td>
                  <span
                    className={`inquiry-status-badge${
                      row.status === 'answered' ? ' inquiry-status-badge--answered' : ''
                    }`}
                  >
                    {inquiryStatusLabel(row.status)}
                  </span>
                </td>
                <td>{new Date(row.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="admin-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => openAnswer(row)}>
                    {row.status === 'answered' ? '답변 수정' : '답변하기'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void deleteInquiry(row.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InquiryAnswerModal
        inquiry={selected}
        open={Boolean(selected)}
        saving={saving}
        onClose={closeAnswer}
        onSave={(answer) => void saveAnswer(answer)}
      />
    </section>
  );
}
