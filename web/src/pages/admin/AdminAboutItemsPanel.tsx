import { useCallback, useEffect, useState } from 'react';
import { ABOUT_ITEM_PAGE_META } from '../../constants/aboutItemFallbacks';
import { ABOUT_PAGE_META } from '../../constants/aboutPages';
import { useToast } from '../../contexts/ToastContext';
import {
  AboutItemCreateCard,
  AboutItemCard,
} from '../../components/about/AboutItemCard';
import {
  AboutItemFormModal,
  EMPTY_ABOUT_ITEM_FORM,
  aboutItemToForm,
  type AboutItemFormState,
} from '../../components/about/AboutItemFormModal';
import {
  adminDeleteAboutItem,
  adminListAboutItems,
  adminUpsertAboutItem,
  adminListAboutPages,
  adminUpsertAboutPage,
} from '../../services/adminService';
import type { AboutItemPageSlug, KemixAboutItem } from '../../types';

type AdminAboutItemsPanelProps = {
  pageSlug: AboutItemPageSlug;
};

export function AdminAboutItemsPanel({ pageSlug }: AdminAboutItemsPanelProps) {
  const { showToast } = useToast();
  const meta = ABOUT_ITEM_PAGE_META[pageSlug];
  const pageMeta = ABOUT_PAGE_META[pageSlug];

  const [items, setItems] = useState<KemixAboutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPage, setSavingPage] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KemixAboutItem | null>(null);
  const [itemForm, setItemForm] = useState<AboutItemFormState>(EMPTY_ABOUT_ITEM_FORM);
  const [pageForm, setPageForm] = useState({
    eyebrow: 'About KEMIX',
    title: '',
    subtitle: '',
    is_published: true,
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, pages] = await Promise.all([
        adminListAboutItems(pageSlug),
        adminListAboutPages(),
      ]);
      setItems(rows);
      const page = pages.find((p) => p.slug === pageSlug);
      if (page) {
        setPageForm({
          eyebrow: page.eyebrow,
          title: page.title,
          subtitle: page.subtitle ?? '',
          is_published: page.is_published,
        });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '불러오기 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [pageSlug, showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSavePageMeta = async () => {
    if (!pageForm.title.trim()) {
      showToast('페이지 제목을 입력해 주세요.', 'error');
      return;
    }
    setSavingPage(true);
    try {
      await adminUpsertAboutPage({
        slug: pageSlug,
        eyebrow: pageForm.eyebrow,
        title: pageForm.title,
        subtitle: pageForm.subtitle || null,
        content: '',
        is_published: pageForm.is_published,
      });
      showToast('페이지 정보가 저장되었습니다.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSavingPage(false);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setItemForm({ ...EMPTY_ABOUT_ITEM_FORM, display_order: items.length });
    setFormOpen(true);
  };

  const openEdit = (item: KemixAboutItem) => {
    setEditingItem(item);
    setItemForm(aboutItemToForm(item));
    setFormOpen(true);
  };

  const handleSaveItem = async (form: AboutItemFormState) => {
    if (!form.title.trim()) {
      showToast('제목을 입력해 주세요.', 'error');
      return;
    }
    if (!form.summary.trim()) {
      showToast('요약을 입력해 주세요.', 'error');
      return;
    }

    setSavingItem(true);
    try {
      await adminUpsertAboutItem({
        id: editingItem?.id,
        page_slug: pageSlug,
        badge_label: form.badge_label.trim() || null,
        title: form.title.trim(),
        summary: form.summary.trim(),
        content: form.content,
        display_order: form.display_order,
        is_published: form.is_published,
      });
      showToast(editingItem ? '항목이 수정되었습니다.' : '항목이 추가되었습니다.');
      setFormOpen(false);
      setEditingItem(null);
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDelete = async (item: KemixAboutItem) => {
    if (!window.confirm(`"${item.title}" 항목을 삭제하시겠습니까?`)) return;
    try {
      await adminDeleteAboutItem(item.id);
      showToast('삭제되었습니다.');
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <section className="admin-panel">
      <h2>{meta.label} 관리</h2>
      <p className="muted">
        사용자 페이지: <a href={pageMeta.path} target="_blank" rel="noreferrer">{pageMeta.path}</a>
      </p>

      <div className="admin-form-card admin-form-card--compact">
        <h3>페이지 헤더 설정</h3>
        <div className="admin-form-grid">
          <label>
            Eyebrow
            <input
              className="modal-input"
              value={pageForm.eyebrow}
              onChange={(e) => setPageForm((p) => ({ ...p, eyebrow: e.target.value }))}
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={pageForm.is_published}
              onChange={(e) => setPageForm((p) => ({ ...p, is_published: e.target.checked }))}
            />
            페이지 공개
          </label>
          <label className="admin-span-2">
            페이지 제목
            <input
              className="modal-input"
              value={pageForm.title}
              onChange={(e) => setPageForm((p) => ({ ...p, title: e.target.value }))}
            />
          </label>
          <label className="admin-span-2">
            부제목
            <input
              className="modal-input"
              value={pageForm.subtitle}
              onChange={(e) => setPageForm((p) => ({ ...p, subtitle: e.target.value }))}
            />
          </label>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="btn btn-secondary" disabled={savingPage} onClick={() => void handleSavePageMeta()}>
            {savingPage ? '저장 중…' : '페이지 정보 저장'}
          </button>
        </div>
      </div>

      <div className="admin-form-actions" style={{ margin: '1.25rem 0' }}>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + 새 항목 추가
        </button>
      </div>

      {loading ? <p className="muted">불러오는 중…</p> : null}

      <div className="about-items-grid about-items-grid--admin">
        <AboutItemCreateCard onClick={openCreate} />
        {items.map((item) => (
          <AboutItemCard
            key={item.id}
            item={item}
            showUnpublished
            onOpen={openEdit}
            onEdit={openEdit}
            onDelete={(row) => void handleDelete(row)}
          />
        ))}
      </div>

      {!loading && items.length === 0 ? (
        <p className="muted">등록된 항목이 없습니다. 새 항목을 추가해 주세요.</p>
      ) : null}

      <AboutItemFormModal
        open={formOpen}
        pageSlug={pageSlug}
        initial={itemForm}
        saving={savingItem}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSave={(form) => void handleSaveItem(form)}
        onUploadError={(msg) => showToast(msg, 'error')}
      />
    </section>
  );
}
