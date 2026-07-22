import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { BRAND_NAME, BRAND_NAME_KO } from '../constants/branding';
import { useAuth } from '../contexts/AuthContext';
import { completeProfileSetup } from '../services/profileService';
import type { ProfileJobRole } from '../types';
import { JOB_ROLE_OPTIONS } from './LoginModal';

const EMPTY = {
  nickname: '',
  name: '',
  phone: '',
  role: 'user' as ProfileJobRole,
  company_name: '',
};

export function ProfileSetupModal() {
  const { needsProfileSetup, refreshProfile } = useAuth();
  const titleId = useId();
  const nicknameRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsProfileSetup) return;

    setForm(EMPTY);
    setError(null);
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => nicknameRef.current?.focus(), 50);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [needsProfileSetup]);

  if (!needsProfileSetup) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const nickname = form.nickname.trim();
    if (!nickname) {
      setError('커뮤니티에서 사용할 별명을 입력해 주세요.');
      return;
    }
    if (nickname.length < 2 || nickname.length > 20) {
      setError('별명은 2~20자로 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      await completeProfileSetup({
        nickname,
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        role: form.role,
        company_name: form.company_name.trim() || undefined,
      });
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로필 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay modal-overlay--blocking" role="presentation">
      <div
        className="modal-dialog modal-dialog--profile-setup"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-brand">
          <span className="modal-brand-mark">{BRAND_NAME}</span>
          <span className="modal-brand-ko">{BRAND_NAME_KO}</span>
        </div>

        <h2 id={titleId} className="modal-title">
          프로필 설정
        </h2>
        <p className="modal-desc">
          최초 1회 프로필을 설정해 주세요. 별명은 커뮤니티 등에서 익명으로 표시됩니다.
        </p>

        <form className="modal-form profile-setup-form" onSubmit={handleSubmit} noValidate>
          <label className="modal-label" htmlFor="profile-nickname">
            별명/닉네임 <span className="modal-required">*</span>
          </label>
          <input
            ref={nicknameRef}
            id="profile-nickname"
            className="modal-input"
            type="text"
            autoComplete="nickname"
            placeholder="커뮤니티 익명 별명"
            value={form.nickname}
            onChange={(e) => setForm((prev) => ({ ...prev, nickname: e.target.value }))}
            disabled={loading}
            required
            maxLength={20}
          />

          <label className="modal-label" htmlFor="profile-name">
            이름
          </label>
          <input
            id="profile-name"
            className="modal-input"
            type="text"
            autoComplete="name"
            placeholder="실명 (선택)"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            disabled={loading}
          />

          <label className="modal-label" htmlFor="profile-phone">
            연락처/전화번호
          </label>
          <input
            id="profile-phone"
            className="modal-input"
            type="tel"
            autoComplete="tel"
            placeholder="010-0000-0000 (선택)"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            disabled={loading}
          />

          <label className="modal-label" htmlFor="profile-role">
            직군/역할 <span className="modal-required">*</span>
          </label>
          <select
            id="profile-role"
            className="modal-input modal-select"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as ProfileJobRole }))}
            disabled={loading}
            required
          >
            {JOB_ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className="modal-label" htmlFor="profile-company">
            소속 기관/병원
          </label>
          <input
            id="profile-company"
            className="modal-input"
            type="text"
            placeholder="소속 (선택)"
            value={form.company_name}
            onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
            disabled={loading}
          />

          {error ? (
            <p className="modal-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary modal-submit" disabled={loading}>
            {loading ? '저장 중…' : '프로필 저장하고 시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
