import { useEffect, useId, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { createCommunityPost } from '../services/communityService';
import { getCommunityDisplayName } from '../services/profileService';
import { getCategoryLabel } from '../constants/communityBoard';
import type { CommunityCategory } from '../types';
import { RichTextEditor, stripHtml } from './RichTextEditor';

type CommunityWriteModalProps = {
  open: boolean;
  onClose: () => void;
  categories: CommunityCategory[];
  onSubmitted: () => void;
};

const EMPTY = { categoryId: '', title: '', content: '' };

export function CommunityWriteModal({ open, onClose, categories, onSubmitted }: CommunityWriteModalProps) {
  const titleId = useId();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const defaultCategory = categories[0]?.id ?? '';
    setForm({ categoryId: defaultCategory, title: '', content: '' });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose, categories]);

  if (!open) return null;

  const authorLabel = getCommunityDisplayName(profile, user?.email);

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.title.trim()) {
      showToast('제목을 입력해 주세요.', 'error');
      return;
    }
    if (!stripHtml(form.content)) {
      showToast('본문을 입력해 주세요.', 'error');
      return;
    }
    if (!form.categoryId) {
      showToast('카테고리를 선택해 주세요.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createCommunityPost({
        title: form.title.trim(),
        content: form.content,
        categoryId: form.categoryId,
        userId: user.id,
        authorLabel,
      });
      showToast('게시글이 등록되었습니다.');
      onSubmitted();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '게시에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog modal-dialog--write"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <h2 id={titleId} className="modal-title">
          게시글 작성
        </h2>
        <p className="modal-desc">응급의료 현장의 경험과 정보를 커뮤니티에 공유해 보세요.</p>

        <div className="write-form">
          <label className="write-label">
            카테고리
            <select
              className="modal-input"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {getCategoryLabel(cat.slug, cat.name)}
                </option>
              ))}
            </select>
          </label>
          <label className="write-label">
            제목
            <input
              className="modal-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="제목을 입력하세요"
              maxLength={120}
            />
          </label>
          <div className="write-label">
            본문
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              placeholder="내용을 입력하세요. 이미지는 툴바의 이미지 버튼으로 업로드할 수 있습니다."
              imageFolder="community"
              onUploadError={(msg) => showToast(msg, 'error')}
            />
          </div>
        </div>

        <div className="write-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? '등록 중…' : '작성 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}
