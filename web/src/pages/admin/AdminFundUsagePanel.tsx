import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteFundUsageReport,
  adminListFundUsageReports,
  adminUpsertFundUsageReport,
  type UpsertFundUsageInput,
} from '../../services/fundUsageService';
import type { FundUsageReport } from '../../types';

const EMPTY_FORM: UpsertFundUsageInput = {
  title: '',
  content: '',
  summary: '',
  amount_used: null,
  receipt_image_url: '',
  is_published: true,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR');
}

export function AdminFundUsagePanel() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<FundUsageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpsertFundUsageInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    try {
      const rows = await adminListFundUsageReports();
      setReports(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const startEdit = (report: FundUsageReport) => {
    setEditingId(report.id);
    setForm({
      id: report.id,
      title: report.title,
      content: report.content,
      summary: report.summary ?? '',
      amount_used: report.amount_used,
      receipt_image_url: report.receipt_image_url ?? '',
      is_published: report.is_published,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('제목은 필수입니다.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminUpsertFundUsageReport({
        ...form,
        title: form.title.trim(),
        summary: form.summary?.trim() || undefined,
        receipt_image_url: form.receipt_image_url?.trim() || undefined,
      });
      showToast(editingId ? '기금 사용 내역이 수정되었습니다.' : '기금 사용 내역이 등록되었습니다.');
      resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 기금 사용 내역을 삭제하시겠습니까?')) return;
    try {
      await adminDeleteFundUsageReport(id);
      showToast('기금 사용 내역이 삭제되었습니다.');
      if (editingId === id) resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  const handleTogglePublished = async (report: FundUsageReport) => {
    try {
      await adminUpsertFundUsageReport({
        id: report.id,
        title: report.title,
        content: report.content,
        summary: report.summary ?? undefined,
        amount_used: report.amount_used,
        receipt_image_url: report.receipt_image_url ?? undefined,
        is_published: !report.is_published,
      });
      await reload();
      showToast(report.is_published ? '비공개 처리되었습니다.' : '공개 처리되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
    }
  };

  return (
    <section className="admin-panel">
      <h2>기금 사용 안내 관리</h2>
      <p className="muted">작성한 내역은 커뮤니티 기금 사용 안내 페이지에 실시간 반영됩니다.</p>

      {error ? <p className="error">{error}</p> : null}

      <div className="admin-form-card">
        <h3>{editingId ? '내역 수정' : '새 내역 작성'}</h3>
        <div className="admin-form-grid">
          <label className="admin-span-full">
            제목
            <input
              className="modal-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className="admin-span-full">
            요약 (목록 노출용)
            <input
              className="modal-input"
              value={form.summary ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="미입력 시 본문에서 자동 추출"
            />
          </label>
          <label>
            사용 금액 (원)
            <input
              className="modal-input"
              type="number"
              min={0}
              value={form.amount_used ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  amount_used: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
            />
          </label>
          <label>
            영수증 이미지 URL
            <input
              className="modal-input"
              value={form.receipt_image_url ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, receipt_image_url: e.target.value }))}
              placeholder="https://..."
            />
          </label>
          <label className="admin-span-full">
            상세 내용 (HTML 가능)
            <textarea
              className="modal-input admin-textarea"
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
            />
            공개
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSave()}>
            {saving ? '저장 중…' : editingId ? '수정 저장' : '등록'}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              취소
            </button>
          ) : null}
        </div>
      </div>

      {loading ? <p className="muted">불러오는 중…</p> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>제목</th>
              <th>금액</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className={!report.is_published ? 'admin-row--inactive' : ''}>
                <td>{formatDate(report.created_at)}</td>
                <td>{report.title}</td>
                <td>{report.amount_used != null ? `${report.amount_used.toLocaleString('ko-KR')}원` : '—'}</td>
                <td>
                  {report.is_published ? (
                    <span className="admin-badge admin-badge--active">공개</span>
                  ) : (
                    <span className="admin-badge">비공개</span>
                  )}
                </td>
                <td className="admin-table-actions">
                  <button type="button" className="btn btn-sm" onClick={() => startEdit(report)}>
                    수정
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => void handleTogglePublished(report)}
                  >
                    {report.is_published ? '비공개' : '공개'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => void handleDelete(report.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
