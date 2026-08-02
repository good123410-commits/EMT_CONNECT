import { useEffect, useId, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  changeAccountPassword,
  updateAccountNickname,
  updateAccountPhone,
  userHasEmailPasswordAuth,
} from '../services/accountProfileService';

type ProfileEditModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ProfileEditModal({ open, onClose }: ProfileEditModalProps) {
  const titleId = useId();
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canChangePassword = userHasEmailPasswordAuth(user);

  useEffect(() => {
    if (!open) return;

    setNickname(profile?.nickname?.trim() || profile?.name?.trim() || user?.user_metadata?.nickname || user?.user_metadata?.name || '');
    setPhone(profile?.phone?.trim() || user?.user_metadata?.phone || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, profile?.nickname, profile?.name, profile?.phone, user?.user_metadata]);

  if (!open || !user) return null;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSaveNickname = async () => {
    setError(null);
    setSavingNickname(true);
    try {
      await updateAccountNickname(user.id, nickname);
      await refreshProfile();
      showToast('별명이 변경되었습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '별명 변경에 실패했습니다.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSavingNickname(false);
    }
  };

  const handleSavePhone = async () => {
    setError(null);
    setSavingPhone(true);
    try {
      await updateAccountPhone(user.id, phone);
      await refreshProfile();
      showToast('전화번호가 변경되었습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '전화번호 변경에 실패했습니다.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user.email) return;

    setError(null);
    setSavingPassword(true);
    try {
      await changeAccountPassword(user.email, currentPassword, newPassword, confirmPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('비밀번호가 변경되었습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={handleClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') handleClose();
      }}
    >
      <div
        className="modal-dialog modal-dialog--profile-edit"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row">
          <h2 id={titleId} className="modal-title">
            개인정보 수정
          </h2>
          <button type="button" className="modal-close-btn" onClick={handleClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <p className="modal-desc">앱과 동일한 계정 정보가 Supabase에 저장되며, 변경 사항은 양쪽에 반영됩니다.</p>

        <div className="profile-edit-form">
          <div className="profile-edit-readonly">
            <span className="profile-edit-label">로그인 이메일</span>
            <p className="profile-edit-value">{user.email}</p>
          </div>

          <section className="profile-edit-section">
            <h3 className="profile-edit-section-title">별명(닉네임)</h3>
            <input
              className="modal-input"
              type="text"
              autoComplete="nickname"
              placeholder="커뮤니티에서 사용할 별명"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={savingNickname}
              maxLength={20}
            />
            <button
              type="button"
              className="btn btn-primary profile-edit-save-btn"
              disabled={savingNickname}
              onClick={() => void handleSaveNickname()}
            >
              {savingNickname ? '저장 중…' : '별명 저장'}
            </button>
          </section>

          <section className="profile-edit-section">
            <h3 className="profile-edit-section-title">전화번호</h3>
            <input
              className="modal-input"
              type="tel"
              autoComplete="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={savingPhone}
            />
            <button
              type="button"
              className="btn btn-primary profile-edit-save-btn"
              disabled={savingPhone}
              onClick={() => void handleSavePhone()}
            >
              {savingPhone ? '저장 중…' : '전화번호 저장'}
            </button>
          </section>

          <section className="profile-edit-section">
            <h3 className="profile-edit-section-title">비밀번호 변경</h3>
            {canChangePassword ? (
              <>
                <input
                  className="modal-input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="현재 비밀번호"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={savingPassword}
                />
                <input
                  className="modal-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="새 비밀번호 (8자 이상)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={savingPassword}
                />
                <input
                  className="modal-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="새 비밀번호 확인"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={savingPassword}
                />
                <button
                  type="button"
                  className="btn btn-primary profile-edit-save-btn"
                  disabled={savingPassword}
                  onClick={() => void handleChangePassword()}
                >
                  {savingPassword ? '변경 중…' : '비밀번호 변경'}
                </button>
              </>
            ) : (
              <p className="profile-edit-note">
                소셜 로그인 계정은 웹에서 비밀번호를 변경할 수 없습니다. 연동된 서비스에서 비밀번호를
                관리해 주세요.
              </p>
            )}
          </section>

          {error ? (
            <p className="modal-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
