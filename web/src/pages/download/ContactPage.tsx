import { useState } from 'react';
import { PageHero } from '../../components/PageHero';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function ContactPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user || !title.trim() || !content.trim()) {
      setError('로그인 후 제목과 내용을 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.rpc('create_user_question', {
        p_title: title.trim(),
        p_content: content.trim(),
      });
      if (insertError) throw insertError;
      setDone(true);
      setTitle('');
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '문의 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-content">
      <PageHero eyebrow="Download & Q&A" title="1:1 문의" subtitle="궁금한 점을 남겨 주세요" dark />
      {done ? (
        <div className="modal-success">
          <p>문의가 접수되었습니다. 담당자가 확인 후 답변드리겠습니다.</p>
        </div>
      ) : (
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
          <button
            type="button"
            className="btn btn-primary"
            disabled={!user || loading}
            onClick={() => void handleSubmit()}
          >
            {loading ? '전송 중…' : '문의 보내기'}
          </button>
        </div>
      )}
    </div>
  );
}
