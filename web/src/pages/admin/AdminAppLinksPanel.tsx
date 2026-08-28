import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { adminUpsertSiteSetting, fetchSiteSetting } from '../../services/siteSettingsService';

export function AdminAppLinksPanel() {
  const { showToast } = useToast();
  const [officialUrl, setOfficialUrl] = useState('');
  const [donationNotice, setDonationNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [official, notice] = await Promise.all([
        fetchSiteSetting('official_website'),
        fetchSiteSetting('donation_notice'),
      ]);
      setOfficialUrl(official.content.trim());
      setDonationNotice(notice.content.trim());
    } catch (err) {
      showToast(err instanceof Error ? err.message : '설정을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    const url = officialUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      showToast('공식 웹사이트는 http:// 또는 https://로 시작해야 합니다.', 'error');
      return;
    }

    setSaving(true);
    try {
      await adminUpsertSiteSetting({
        key: 'official_website',
        title: '공식 웹사이트',
        content: url,
      });
      await adminUpsertSiteSetting({
        key: 'donation_notice',
        title: '후원 안내',
        content: donationNotice.trim(),
      });
      showToast('앱 연동 설정이 저장되었습니다.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <h2>앱 연동 설정</h2>
      <p className="muted">
        모바일 앱 설정 탭의 「공식 웹사이트」「후원하기」에 연동됩니다. 후원 계좌는 「모금 계좌」
        탭에서 관리하세요.
      </p>

      {loading ? <p className="muted">불러오는 중…</p> : null}

      <div className="admin-form-card">
        <div className="admin-form-grid">
          <label>
            공식 웹사이트 URL
            <input
              className="modal-input"
              type="url"
              placeholder="https://example.com"
              value={officialUrl}
              onChange={(e) => setOfficialUrl(e.target.value)}
            />
          </label>

          <label>
            후원하기 안내 문구 (앱 모달)
            <textarea
              className="modal-textarea admin-textarea--summary"
              rows={5}
              placeholder="후원 목적·이용 안내를 입력하세요."
              value={donationNotice}
              onChange={(e) => setDonationNotice(e.target.value)}
            />
          </label>
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
