import { useEffect, useState } from 'react';
import type { KemixGuide } from '../services/guideService';
import { useToast } from '../contexts/ToastContext';
import {
  copyGuideLink,
  emailGuideShare,
  shareGuideWithNavigator,
} from '../utils/guideShare';
import {
  isKakaoReadySync,
  isKakaoShareAvailable,
  preloadKakaoSdk,
  shareGuideOnKakao,
  shareGuideOnKakaoSync,
} from '../utils/kakaoShare';

type GuideShareSheetProps = {
  guide: KemixGuide | null;
  open: boolean;
  onClose: () => void;
};

export function GuideShareSheet({ guide, open, onClose }: GuideShareSheetProps) {
  const { showToast } = useToast();
  const [kakaoReady, setKakaoReady] = useState(isKakaoReadySync);
  const [shareError, setShareError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !isKakaoShareAvailable()) return;
    setKakaoReady(isKakaoReadySync());
    void preloadKakaoSdk().then((err) => {
      if (err) setShareError(err);
      setKakaoReady(isKakaoReadySync());
    });
  }, [open]);

  if (!open || !guide) return null;

  const handleKakao = () => {
    setShareError(null);
    onClose();

    window.setTimeout(() => {
      if (isKakaoReadySync()) {
        const err = shareGuideOnKakaoSync(guide);
        if (err) showToast(err, 'error');
        return;
      }

      void shareGuideOnKakao(guide).then((err) => {
        setKakaoReady(isKakaoReadySync());
        if (err) showToast(err, 'error');
      });
    }, 280);
  };

  const runDeferred = (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    onClose();
    window.setTimeout(() => {
      void action()
        .catch((err) => {
          showToast(err instanceof Error ? err.message : '공유에 실패했습니다.', 'error');
        })
        .finally(() => setBusy(false));
    }, 280);
  };

  return (
    <div className="modal-overlay guide-share-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card guide-share-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-share-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>

        <h2 id="guide-share-title" className="guide-share-title">
          공유하기
        </h2>
        <p className="guide-share-subtitle">{guide.title}</p>

        <div className="guide-share-actions">
          {isKakaoShareAvailable() ? (
            <button
              type="button"
              className="btn btn-kakao"
              disabled={!kakaoReady && !shareError}
              onClick={handleKakao}
            >
              {kakaoReady ? '카카오톡으로 공유' : shareError ? '카카오톡 공유 재시도' : '공유 준비 중…'}
            </button>
          ) : null}

          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() =>
              runDeferred(async () => {
                await shareGuideWithNavigator(guide);
              })
            }
          >
            앱으로 공유
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() =>
              runDeferred(async () => {
                await emailGuideShare(guide);
              })
            }
          >
            이메일로 공유
          </button>

          <button
            type="button"
            className="btn btn-outline"
            disabled={busy}
            onClick={() =>
              runDeferred(async () => {
                await copyGuideLink(guide);
                showToast('링크가 클립보드에 복사되었습니다.');
              })
            }
          >
            링크 복사
          </button>
        </div>

        {shareError ? <p className="modal-error">{shareError}</p> : null}
      </div>
    </div>
  );
}
