import { useCallback, useEffect, useState } from 'react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { useToast } from '../../contexts/ToastContext';
import { adminListSiteSettings, adminUpsertSiteSetting } from '../../services/siteSettingsService';
import type { SiteSetting, SiteSettingKey } from '../../types';

const SETTING_META: Record<SiteSettingKey, { label: string; path: string }> = {
  privacy_policy: { label: '개인정보 처리방침', path: '/legal/privacy' },
  terms_of_service: { label: '이용약관', path: '/legal/terms' },
  service_info: { label: 'KEMIX 서비스 정보', path: '/legal/service' },
};

export function AdminSiteSettingsPanel() {
  const { showToast } = useToast();
  const [activeKey, setActiveKey] = useState<SiteSettingKey>('privacy_policy');
  const [rows, setRows] = useState<SiteSetting[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminListSiteSettings();
      setRows(data);
      const current = data.find((r) => r.key === activeKey);
      if (current) {
        setTitle(current.title);
        setContent(current.content);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '설정을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeKey, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const current = rows.find((r) => r.key === activeKey);
    if (current) {
      setTitle(current.title);
      setContent(current.content);
    }
  }, [activeKey, rows]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpsertSiteSetting({ key: activeKey, title, content });
      showToast('저장되었습니다.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const meta = SETTING_META[activeKey];

  return (
    <section className="admin-panel">
      <h2>사이트 설정 관리</h2>
      <p className="muted">
        설정 드롭다운·푸터에 노출되는 약관·서비스 정보를 수정합니다.
        {meta ? (
          <>
            {' '}
            미리보기: <a href={meta.path} target="_blank" rel="noreferrer">{meta.path}</a>
          </>
        ) : null}
      </p>

      <div className="admin-settings-tabs">
        {(Object.keys(SETTING_META) as SiteSettingKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`admin-settings-tab${activeKey === key ? ' admin-settings-tab--active' : ''}`}
            onClick={() => setActiveKey(key)}
          >
            {SETTING_META[key].label}
          </button>
        ))}
      </div>

      {loading ? <p className="muted">불러오는 중…</p> : null}

      <div className="admin-form-card">
        <label className="admin-span-full">
          페이지 제목
          <input className="modal-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <div className="admin-span-full" style={{ marginTop: '1rem' }}>
          <span className="image-upload-label">본문</span>
          <RichTextEditor
            value={content}
            onChange={setContent}
            imageFolder="legal"
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
