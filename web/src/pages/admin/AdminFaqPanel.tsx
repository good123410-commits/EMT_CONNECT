import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteFaq,
  adminDeleteQuestion,
  adminListFaqs,
  adminListQuestions,
  adminUpsertFaq,
  type AdminQuestion,
} from '../../services/adminService';
import type { FaqItem } from '../../types';
import { useAdminForm } from './adminShared';

const EMPTY_FAQ = { question: '', answer: '', category: 'general', display_order: 0, is_published: true };

export function AdminFaqPanel() {
  const { showToast } = useToast();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { form, setForm, editingId, reset, startEdit } = useAdminForm(EMPTY_FAQ);

  const reload = useCallback(async () => {
    try {
      const [f, q] = await Promise.all([adminListFaqs(), adminListQuestions()]);
      setFaqs(f);
      setQuestions(q);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '불러오기 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveFaq = async () => {
    setSaving(true);
    try {
      await adminUpsertFaq({ ...form, id: editingId ?? undefined });
      showToast('FAQ가 저장되었습니다.');
      reset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteFaq = async (id: string) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await adminDeleteFaq(id);
      showToast('FAQ가 삭제되었습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!window.confirm('문의를 삭제하시겠습니까?')) return;
    try {
      await adminDeleteQuestion(id);
      showToast('문의가 삭제되었습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <section className="admin-panel">
      <h2>FAQ & Q&A 관리</h2>

      <div className="admin-form-card">
        <h3>FAQ {editingId ? '수정' : '등록'}</h3>
        <div className="admin-form-grid">
          <label className="admin-span-2">질문<input className="modal-input" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></label>
          <label className="admin-span-2">답변<textarea className="modal-textarea" rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></label>
          <label>카테고리<input className="modal-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
          <label>순서<input className="modal-input" type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> 공개</label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void saveFaq()}>저장</button>
          {editingId ? <button type="button" className="btn btn-secondary" onClick={reset}>취소</button> : null}
        </div>
      </div>

      {loading ? <p className="muted">불러오는 중…</p> : null}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>질문</th><th>카테고리</th><th>공개</th><th>관리</th></tr></thead>
          <tbody>
            {faqs.map((f) => (
              <tr key={f.id}>
                <td>{f.question}</td><td>{f.category}</td><td>{f.is_published ? 'Y' : 'N'}</td>
                <td className="admin-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(f.id, { question: f.question, answer: f.answer, category: f.category, display_order: f.display_order, is_published: f.is_published })}>수정</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void deleteFaq(f.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="admin-subheading">1:1 문의 (Q&A)</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>제목</th><th>상태</th><th>등록일</th><th>관리</th></tr></thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td>{q.title}</td>
                <td>{q.status}</td>
                <td>{new Date(q.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="admin-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void deleteQuestion(q.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
