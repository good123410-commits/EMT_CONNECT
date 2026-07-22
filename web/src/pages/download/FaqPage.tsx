import { useEffect, useState } from 'react';
import { PageHero } from '../../components/PageHero';
import { fetchPublishedFaqs } from '../../services/faqService';
import type { FaqItem } from '../../types';

export function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    void fetchPublishedFaqs()
      .then(setFaqs)
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container page-content">
      <PageHero eyebrow="Download & Q&A" title="자주 묻는 질문" subtitle="KEMIX 이용에 관한 FAQ" dark />
      {loading ? <p className="muted">불러오는 중…</p> : null}
      <div className="faq-list">
        {faqs.map((faq) => (
          <div key={faq.id} className={`faq-item${openId === faq.id ? ' faq-item--open' : ''}`}>
            <button
              type="button"
              className="faq-question"
              onClick={() => setOpenId((id) => (id === faq.id ? null : faq.id))}
            >
              {faq.question}
              <span className="faq-toggle">{openId === faq.id ? '−' : '+'}</span>
            </button>
            {openId === faq.id ? <div className="faq-answer">{faq.answer}</div> : null}
          </div>
        ))}
      </div>
      {!loading && faqs.length === 0 ? (
        <div className="faq-fallback">
          <div className="faq-item faq-item--open">
            <p className="faq-question">KEMIX는 무엇인가요?</p>
            <div className="faq-answer">
              KEMIX(케믹스)는 Korea EMT Medical Innovation eXchange / NeXt의 약자로, 응급실 정보·
              생활 응급처치 가이드·EMS 커뮤니티를 하나로 연결하는 공식 플랫폼입니다.
            </div>
          </div>
          <div className="faq-item faq-item--open">
            <p className="faq-question">웹과 앱 계정이 같나요?</p>
            <div className="faq-answer">
              네. 동일한 Supabase 인증 시스템을 사용하므로 웹과 모바일 앱에서 같은 이메일·비밀번호로
              로그인할 수 있습니다.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
