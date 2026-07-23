import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
  adminUpdateAppDownloadSettings,
  fetchAppDownloadSettings,
  mergeAppDownloadSettings,
  type UpdateAppDownloadInput,
} from '../../services/appDownloadService';
import { uploadImageFile } from '../../services/storageService';
import type { AppDownloadSettings } from '../../types';

const EMPTY_FORM: UpdateAppDownloadInput = {
  ios_store_url: '',
  android_store_url: '',
  deep_link: '',
  latest_version: '',
  qr_code_image_url: '',
  description: '',
};

export function AdminAppDownloadPanel() {
  const { showToast } = useToast();
  const [form, setForm] = useState<UpdateAppDownloadInput>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const row = mergeAppDownloadSettings(await fetchAppDownloadSettings());
      setForm({
        ios_store_url: row.ios_store_url,
        android_store_url: row.android_store_url,
        deep_link: row.deep_link,
        latest_version: row.latest_version ?? '',
        qr_code_image_url: row.qr_code_image_url ?? '',
        description: row.description,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '설정을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleQrUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageFile(file, 'app-download');
      setForm((f) => ({ ...f, qr_code_image_url: url }));
      showToast('QR 코드 이미지가 업로드되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminUpdateAppDownloadSettings({
        ...form,
        latest_version: form.latest_version?.trim() || null,
        qr_code_image_url: form.qr_code_image_url?.trim() || null,
      });
      showToast('앱 다운로드 설정이 저장되었습니다.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <h2>앱 다운로드 관리</h2>
      <p className="muted">스토어 URL, 버전 정보, QR 코드를 관리합니다. 변경 사항은 앱 다운로드 페이지에 반영됩니다.</p>

      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading ? (
        <div className="admin-form-card">
          <div className="admin-form-grid">
            <label>
              iOS App Store URL
              <input
                className="modal-input"
                value={form.ios_store_url ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, ios_store_url: e.target.value }))}
              />
            </label>
            <label>
              Android Play Store URL
              <input
                className="modal-input"
                value={form.android_store_url ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, android_store_url: e.target.value }))}
              />
            </label>
            <label>
              딥링크
              <input
                className="modal-input"
                value={form.deep_link ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, deep_link: e.target.value }))}
              />
            </label>
            <label>
              최신 버전
              <input
                className="modal-input"
                value={form.latest_version ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, latest_version: e.target.value }))}
                placeholder="예: 1.2.0"
              />
            </label>
            <label className="admin-span-full">
              안내 문구
              <textarea
                className="modal-input admin-textarea"
                rows={3}
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label className="admin-span-full">
              QR 코드 이미지
              <input
                type="file"
                accept="image/*"
                className="modal-input"
                disabled={uploading}
                onChange={(e) => void handleQrUpload(e.target.files?.[0] ?? null)}
              />
              {form.qr_code_image_url ? (
                <img
                  src={form.qr_code_image_url}
                  alt="QR 코드 미리보기"
                  className="admin-qr-preview"
                />
              ) : null}
            </label>
          </div>
          <div className="admin-form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving || uploading}
              onClick={() => void handleSave()}
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
