import { DownloadSubNav } from '../../components/DownloadSubNav';
import { PageHero } from '../../components/PageHero';
import { useAppDownloadSettings } from '../../hooks/useAppDownloadSettings';

export function DownloadAppPage() {
  const { settings, loading, error } = useAppDownloadSettings();

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="Resources & Q&A"
        title="앱 다운로드"
        subtitle="KEMIX 모바일 앱으로 더 빠르게 응급의료 정보를 확인하세요"
        dark
      />
      <DownloadSubNav />

      {loading ? <p className="muted">불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {settings?.description ? <p className="lead download-app-desc">{settings.description}</p> : null}

      {settings?.latest_version ? (
        <p className="download-app-version">최신 버전 {settings.latest_version}</p>
      ) : null}

      <div className="download-actions download-app-actions">
        {settings?.deep_link ? (
          <a href={settings.deep_link} className="btn btn-primary btn-lg">
            앱에서 열기
          </a>
        ) : null}
        {settings?.ios_store_url ? (
          <a
            href={settings.ios_store_url}
            className="btn btn-secondary btn-lg"
            target="_blank"
            rel="noreferrer"
          >
            App Store (iOS)
          </a>
        ) : null}
        {settings?.android_store_url ? (
          <a
            href={settings.android_store_url}
            className="btn btn-secondary btn-lg"
            target="_blank"
            rel="noreferrer"
          >
            Google Play (Android)
          </a>
        ) : null}
      </div>

      {settings?.qr_code_image_url ? (
        <figure className="download-qr-wrap">
          <figcaption>앱 설치 QR 코드</figcaption>
          <img src={settings.qr_code_image_url} alt="KEMIX 앱 설치 QR 코드" className="download-qr-image" />
        </figure>
      ) : null}
    </div>
  );
}
