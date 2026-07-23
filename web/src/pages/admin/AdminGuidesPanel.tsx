import { useCallback, useEffect, useState } from 'react';
import { GuideCategoryManageModal } from '../../components/GuideCategoryManageModal';
import { ImageUploadField } from '../../components/ImageUploadField';
import { RichTextEditor } from '../../components/RichTextEditor';
import { useToast } from '../../contexts/ToastContext';
import {
  adminDeleteGuide,
  adminListGuides,
  adminListPostCategories,
  adminUpsertGuide,
  slugify,
  type KemixPost,
  type PostCategory,
  type UpsertGuideInput,
} from '../../services/adminService';
import { useAdminForm } from './adminShared';

const FALLBACK_CATEGORIES = ['심폐소생술', '외상', '중독', '소아', '화상', '기타'];

const EMPTY: UpsertGuideInput = {
  title: '',
  slug: '',
  content: '',
  thumbnail_url: '',
  is_published: false,
  category: '심폐소생술',
  seo_title: '',
  seo_description: '',
};

export function AdminGuidesPanel() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<KemixPost[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { form, setForm, editingId, reset, startEdit } = useAdminForm(EMPTY);

  const categoryNames =
    categories.length > 0
      ? categories.filter((c) => c.is_active).map((c) => c.name)
      : FALLBACK_CATEGORIES;

  const reloadCategories = useCallback(async () => {
    const cats = await adminListPostCategories();
    setCategories(cats);
    return cats;
  }, []);

  const reload = useCallback(async () => {
    try {
      const [guides, cats] = await Promise.all([adminListGuides(), adminListPostCategories()]);
      setRows(guides);
      setCategories(cats);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '불러오기 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast('제목을 입력해 주세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      const slug = form.slug.trim() || slugify(form.title);
      await adminUpsertGuide({ ...form, slug, id: editingId ?? undefined });
      showToast(editingId ? '가이드가 수정되었습니다.' : '가이드가 등록되었습니다.');
      reset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await adminDeleteGuide(id);
      showToast('삭제되었습니다.');
      if (editingId === id) reset();
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  const handleCategoriesChanged = async () => {
    const cats = await reloadCategories();
    const names = cats.filter((c) => c.is_active).map((c) => c.name);
    if (names.length > 0 && !names.includes(form.category)) {
      setForm({ ...form, category: names[0] });
    }
  };

  return (
    <section className="admin-panel">
      <h2>생활 응급처치 가이드 관리</h2>
      <p className="muted">저장 즉시 웹·모바일 앱 kemi_posts DB에 반영됩니다.</p>

      <div className="admin-form-card">
        <h3>{editingId ? '가이드 수정' : '새 가이드 등록'}</h3>
        <div className="admin-form-grid admin-form-grid--guides">
          <label>
            제목
            <input
              className="modal-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })}
            />
          </label>
          <label>
            슬러그
            <input className="modal-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </label>
          <label className="admin-category-field">
            카테고리
            <div className="admin-category-row">
              <select
                className="modal-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categoryNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCategoryModalOpen(true)}>
                + 카테고리 관리
              </button>
            </div>
          </label>
          <div className="admin-span-full">
            <ImageUploadField
              label="대표 썸네일"
              folder="guides"
              value={form.thumbnail_url ?? ''}
              onChange={(url) => setForm({ ...form, thumbnail_url: url })}
              onError={(msg) => showToast(msg, 'error')}
            />
          </div>
          <div className="admin-span-full">
            <span className="image-upload-label">상세 처치 가이드 (단계별)</span>
            <p className="admin-field-tip">
              폰트·색상·정렬·인용구·이미지 첨부를 툴바에서 사용할 수 있습니다. 이미지는 본문 원하는 위치에
              삽입되어 글과 번갈아 작성할 수 있습니다.
            </p>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              placeholder="1단계: 상황을 확인합니다.&#10;2단계: 응급처치를 시행합니다."
              imageFolder="guides"
              variant="article"
              minHeight={360}
              onUploadError={(msg) => showToast(msg, 'error')}
            />
          </div>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            공개 (앱·웹 동기화)
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSave()}>
            {saving ? '저장 중…' : editingId ? '수정 저장' : '등록'}
          </button>
          {editingId ? (
            <button type="button" className="btn btn-secondary" onClick={reset}>
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
              <th>제목</th>
              <th>카테고리</th>
              <th>공개</th>
              <th>조회</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.category ?? '-'}</td>
                <td>{r.is_published ? 'Y' : 'N'}</td>
                <td>{r.views}</td>
                <td className="admin-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      startEdit(r.id, {
                        title: r.title,
                        slug: r.slug,
                        content: r.content,
                        thumbnail_url: r.thumbnail_url ?? '',
                        is_published: r.is_published,
                        category: r.category ?? '기타',
                        seo_title: r.seo_title ?? '',
                        seo_description: r.seo_description ?? '',
                      })
                    }
                  >
                    수정
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleDelete(r.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GuideCategoryManageModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onChanged={() => void handleCategoriesChanged()}
      />
    </section>
  );
}
