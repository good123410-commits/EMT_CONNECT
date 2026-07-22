import { useCallback, useEffect, useState } from 'react';
import { PageHero } from '../../components/PageHero';
import { useAuth } from '../../contexts/AuthContext';
import {
  createInquiry,
  fetchMyInquiries,
  inquiryStatusLabel,
} from '../../services/inquiryService';
import type { KemixInquiry } from '../../types';

export function ContactPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [inquiries, setInquiries] = useState<KemixInquiry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    if (!user) {
      setInquiries([]);
      return;
    }
    setListLoading(true);
    try {
      const rows = await fetchMyInquiries();
      setInquiries(rows);
    } catch {
      setInquiries([]);
    } finally {
      setListLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  const handleSubmit = async () => {
    if (!user || !title.trim() || !content.trim()) {
      setError('로그인 후 제목과 내용을 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await createInquiry(title.trim(), content.trim());
      setSuccess('문의가 접수되었습니다. 담당자가 확인 후 답변드리겠습니다.');
      setTitle('');
      setContent('');
      await loadInquiries();
    } catch (err) {
      setError(err instanceof Error ? err.message : '문의 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-content">
      <PageHero eyebrow="Download & Q&A" title="1:1 문의" subtitle="궁금한 점을 남겨 주세요" dark />

      <p className="contact-privacy-note">
        1:1 문의는 비밀글로 처리되며, 작성자 본인과 관리자만 열람할 수 있습니다.
      </p>

      <div className="contact-form">
        {!user && <p className="modal-error">로그인 후 문의할 수 있습니다.</p>}
        <label className="modal-label" htmlFor="contact-title">
          제목
        </label>
        <input
          id="contact-title"
          className="modal-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!user || loading}
        />
        <label className="modal-label" htmlFor="contact-content">
          내용
        </label>
        <textarea
          id="contact-content"
          className="modal-textarea"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!user || loading}
        />
        {error ? <p className="modal-error">{error}</p> : null}
        {success ? <p className="modal-success">{success}</p> : null}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!user || loading}
          onClick={() => void handleSubmit()}
        >
          {loading ? '전송 중…' : '문의 보내기'}
        </button>
      </div>

      {user ? (
        <section className="contact-inquiry-list">
          <h2 className="contact-inquiry-heading">내 문의 내역</h2>
          {listLoading ? <p className="muted">불러오는 중…</p> : null}
          {!listLoading && inquiries.length === 0 ? (
            <p className="muted">등록한 문의가 없습니다.</p>
          ) : null}
          <div className="inquiry-user-list">
            {inquiries.map((item) => {
              const open = expandedId === item.id;
              return (
                <article key={item.id} className={`inquiry-user-card${open ? ' inquiry-user-card--open' : ''}`}>
                  <button
                    type="button"
                    className="inquiry-user-card-header"
                    onClick={() => setExpandedId((id) => (id === item.id ? null : item.id))}
                  >
                    <div>
                      <p className="inquiry-user-card-title">{item.title}</p>
                      <p className="inquiry-user-card-meta">
                        {new Date(item.created_at).toLocaleDateString('ko-KR')} ·{' '}
                        <span
                          className={`inquiry-status-badge${
                            item.status === 'answered' ? ' inquiry-status-badge--answered' : ''
                          }`}
                        >
                          {inquiryStatusLabel(item.status)}
                        </span>
                      </p>
                    </div>
                    <span className="inquiry-user-card-toggle" aria-hidden>
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  {open ? (
                    <div className="inquiry-user-card-body">
                      <p className="inquiry-user-card-label">문의 내용</p>
                      <p className="inquiry-user-card-content">{item.content}</p>
                      {item.status === 'answered' && item.admin_answer ? (
                        <>
                          <p className="inquiry-user-card-label">관리자 답변</p>
                          <p className="inquiry-user-card-answer">{item.admin_answer}</p>
                        </>
                      ) : (
                        <p className="inquiry-user-card-pending">답변 대기 중입니다.</p>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
