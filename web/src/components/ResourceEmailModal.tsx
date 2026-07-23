import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sendResourceByEmail } from '../services/resourceEmailService';
import type { KemixResource } from '../types';

type ResourceEmailModalProps = {
  resource: KemixResource | null;
  open: boolean;
  onClose: () => void;
};

export function ResourceEmailModal({ resource, open, onClose }: ResourceEmailModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open || !resource) return null;

  const handleSend = async () => {
    const to = email.trim();
    if (!to) {
      setError('이메일 주소를 입력해 주세요.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await sendResourceByEmail({
        to,
        title: resource.title,
        description: resource.description,
        fileUrl: resource.file_url,
        fileName: resource.file_name,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '이메일 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={handleClose}>
      <div
        className="modal-card resource-email-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-email-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={handleClose} aria-label="닫기">
          ×
        </button>
        <h2 id="resource-email-title" className="resource-email-modal-title">
          이메일로 자료 전송
        </h2>
        <p className="resource-email-modal-desc">
          <strong>{resource.title}</strong> 다운로드 링크를 입력한 이메일로 보내드립니다.
        </p>

        {success ? (
          <p className="modal-success">이메일이 전송되었습니다.</p>
        ) : (
          <>
            <label className="modal-label" htmlFor="resource-email-to">
              받는 이메일
            </label>
            <input
              id="resource-email-to"
              type="email"
              className="modal-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              disabled={sending}
            />
            {error ? <p className="modal-error">{error}</p> : null}
            <div className="resource-email-modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={sending}
                onClick={() => void handleSend()}
              >
                {sending ? '전송 중…' : '이메일 전송'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={sending}>
                취소
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
