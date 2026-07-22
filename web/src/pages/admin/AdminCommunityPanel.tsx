import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteCommunityCategory,
  adminDeleteCommunityPost,
  adminHideCommunityPost,
  adminListCommunityCategories,
  adminListCommunityPosts,
  adminSetCommunityNotice,
  adminUpsertCommunityCategory,
  slugify,
  type AdminCommunityPost,
  type CommunityCategory,
} from '../../services/adminService';
import { useAdminForm } from './adminShared';

const EMPTY_CAT = { name: '', slug: '', display_order: 0, is_active: true };

export function AdminCommunityPanel() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { form: catForm, setForm: setCatForm, editingId: editingCatId, reset: resetCat, startEdit: startCatEdit } = useAdminForm(EMPTY_CAT);

  const reload = useCallback(async () => {
    try {
      const [cats, ps] = await Promise.all([adminListCommunityCategories(), adminListCommunityPosts()]);
      setCategories(cats);
      setPosts(ps);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '불러오기 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveCategory = async () => {
    setSaving(true);
    try {
      await adminUpsertCommunityCategory({
        ...catForm,
        id: editingCatId ?? undefined,
        slug: catForm.slug || slugify(catForm.name),
      });
      showToast('카테고리가 저장되었습니다.');
      resetCat();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('카테고리를 삭제하시겠습니까?')) return;
    try {
      await adminDeleteCommunityCategory(id);
      showToast('카테고리가 삭제되었습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  const toggleHide = async (post: AdminCommunityPost) => {
    try {
      await adminHideCommunityPost(post.id, !post.is_hidden);
      showToast(post.is_hidden ? '게시글이 복원되었습니다.' : '게시글이 블라인드 처리되었습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '처리 실패', 'error');
    }
  };

  const toggleNotice = async (post: AdminCommunityPost) => {
    try {
      await adminSetCommunityNotice(post.id, !post.is_notice);
      showToast(post.is_notice ? '공지가 해제되었습니다.' : '공지로 등록되었습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '처리 실패', 'error');
    }
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;
    try {
      await adminDeleteCommunityPost(id);
      showToast('게시글이 삭제되었습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <section className="admin-panel">
      <h2>자유게시판 & 카테고리 관리</h2>

      <div className="admin-form-card">
        <h3>카테고리 {editingCatId ? '수정' : '추가'}</h3>
        <div className="admin-form-grid">
          <label>이름<input className="modal-input" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value, slug: slugify(e.target.value) })} /></label>
          <label>슬러그<input className="modal-input" value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} /></label>
          <label>순서<input className="modal-input" type="number" value={catForm.display_order} onChange={(e) => setCatForm({ ...catForm, display_order: Number(e.target.value) })} /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={catForm.is_active} onChange={(e) => setCatForm({ ...catForm, is_active: e.target.checked })} /> 활성</label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void saveCategory()}>저장</button>
          {editingCatId ? <button type="button" className="btn btn-secondary" onClick={resetCat}>취소</button> : null}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>카테고리</th><th>슬러그</th><th>순서</th><th>상태</th><th>관리</th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td><td>{c.slug}</td><td>{c.display_order}</td>
                <td>{c.is_active ? '활성' : '비활성'}</td>
                <td className="admin-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => startCatEdit(c.id, { name: c.name, slug: c.slug, display_order: c.display_order, is_active: c.is_active })}>수정</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void deleteCategory(c.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="admin-subheading">게시글 모니터링</h3>
      {loading ? <p className="muted">불러오는 중…</p> : null}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>작성자</th><th>내용</th><th>공지</th><th>상태</th><th>관리</th></tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className={p.is_hidden ? 'admin-row--inactive' : ''}>
                <td>{p.anonymous_label}</td>
                <td className="admin-cell-truncate">{p.content.slice(0, 80)}</td>
                <td>{p.is_notice ? '📌' : '-'}</td>
                <td>{p.is_hidden ? '블라인드' : '정상'}</td>
                <td className="admin-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void toggleNotice(p)}>{p.is_notice ? '공지해제' : '공지'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void toggleHide(p)}>{p.is_hidden ? '복원' : '블라인드'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void deletePost(p.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
