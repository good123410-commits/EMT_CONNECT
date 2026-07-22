import { PageHero } from '../../components/PageHero';
import { AppCtaBanner } from '../../components/AppCtaBanner';

const APP_DEEP_LINK = import.meta.env.VITE_APP_DEEP_LINK ?? 'emtconnect://map';
const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL ?? '#';

export function DownloadAppPage() {
  return (
    <div className="container page-content">
      <PageHero
        eyebrow="Download & Q&A"
        title="앱 다운로드"
        subtitle="KEMIX 모바일 앱으로 더 빠르게 응급의료 정보를 확인하세요"
        dark
      />
      <div className="download-actions">
        <a href={APP_DEEP_LINK} className="btn btn-primary btn-lg">
          앱에서 열기
        </a>
        <a href={APP_STORE_URL} className="btn btn-secondary btn-lg" target="_blank" rel="noreferrer">
          스토어에서 다운로드
        </a>
      </div>
      <AppCtaBanner />
    </div>
  );
}
