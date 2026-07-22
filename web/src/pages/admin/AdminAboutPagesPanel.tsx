import { useCallback, useEffect, useState } from 'react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { ABOUT_PAGE_META, getAboutFallback } from '../../constants/aboutPages';
import { useToast } from '../../contexts/ToastContext';
import { adminListAboutPages, adminUpsertAboutPage } from '../../services/adminService';
import type { AboutPageSlug } from '../../types';

type AdminAboutPagesPanelProps = {
  slug: AboutPageSlug;
};

export function AdminAboutPagesPanel({ slug }: AdminAboutPagesPanelProps) {
  const { showToast } = useToast();
  const meta = ABOUT_PAGE_META[slug];
  const fallback = getAboutFallback(slug);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    eyebrow: fallback?.eyebrow ?? 'About KEMIX',
    title: fallback?.title ?? '',
    subtitle: fallback?.subtitle ?? '',
    content: fallback?.content ?? '',
    is_published: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await adminListAboutPages();
      const row = rows.find((r) => r.slug === slug);
      if (row) {
        setForm({
          eyebrow: row.eyebrow,
          title: row.title,
          subtitle: row.subtitle ?? '',
          content: row.content,
          is_published: row.is_published,
        });
      } else if (fallback) {
        setForm({
          eyebrow: fallback.eyebrow,
          title: fallback.title,
          subtitle: fallback.subtitle,
          content: fallback.content,
          is_published: true,
        });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '불러오기 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [slug, fallback, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast('페이지 제목을 입력해 주세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminUpsertAboutPage({
        slug,
        eyebrow: form.eyebrow,
        title: form.title,
        subtitle: form.subtitle || null,
        content: form.content,
        is_published: form.is_published,
      });
      showToast('저장되었습니다.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <h2>{meta.label} 관리</h2>
      <p className="muted">
        사용자 페이지: <a href={meta.path} target="_blank" rel="noreferrer">{meta.path}</a>
      </p>

      {loading ? <p className="muted">불러오는 중…</p> : null}

      <div className="admin-form-card">
        <div className="admin-form-grid">
          <label>
            Eyebrow
            <input
              className="modal-input"
              value={form.eyebrow}
              onChange={(e) => setForm((p) => ({ ...p, eyebrow: e.target.value }))}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
            />
            공개
          </label>
          <label className="admin-span-2">
            페이지 제목
            <input
              className="modal-input"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </label>
          <label className="admin-span-2">
            부제목
            <input
              className="modal-input"
              value={form.subtitle}
              onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
            />
          </label>
        </div>

        <div className="admin-span-full" style={{ marginTop: '1rem' }}>
          <span className="image-upload-label">본문 (리치 텍스트)</span>
          <RichTextEditor
            value={form.content}
            onChange={(content) => setForm((p) => ({ ...p, content }))}
            imageFolder="about"
            variant="article"
            minHeight={320}
            onUploadError={(msg) => showToast(msg, 'error')}
          />
        </div>

        <div className="admin-form-actions">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSave()}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </section>
  );
}
