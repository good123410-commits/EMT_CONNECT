import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  fetchEmergencyMedicalShare,
  type EmergencyMedicalSharePayload,
  type EmergencyMedicalShareRecord,
} from '../services/emergencyShareService';

function ContactBlock({
  label,
  name,
  phone,
}: {
  label: string;
  name?: string;
  phone?: string;
}) {
  const n = name?.trim() ?? '';
  const p = phone?.trim() ?? '';
  if (!n && !p) return null;

  return (
    <div className="emergency-share__block">
      <p className="emergency-share__label">{label}</p>
      {n ? <p className="emergency-share__value">{n}</p> : null}
      {p ? (
        <a className="emergency-share__phone" href={`tel:${p.replace(/\s/g, '')}`}>
          {p}
        </a>
      ) : null}
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value?: string }) {
  const text = value?.trim() ?? '';
  if (!text) return null;
  return (
    <div className="emergency-share__block">
      <p className="emergency-share__label">{label}</p>
      <p className="emergency-share__note">{text}</p>
    </div>
  );
}

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function hasPayloadContent(payload: EmergencyMedicalSharePayload): boolean {
  return Boolean(
    payload.fullName?.trim() ||
      payload.contact1Name?.trim() ||
      payload.contact1Phone?.trim() ||
      payload.contact2Name?.trim() ||
      payload.contact2Phone?.trim() ||
      payload.allergiesMedications?.trim() ||
      payload.medicalNotes?.trim() ||
      payload.preferredHospital?.trim(),
  );
}

export function EmergencySharePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<EmergencyMedicalShareRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setRecord(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchEmergencyMedicalShare(token)
      .then((data) => {
        if (cancelled) return;
        setRecord(data);
      })
      .catch(() => {
        if (cancelled) return;
        setError('응급 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const payload = record?.payload;

  return (
    <div className="emergency-share-page">
      <div className="container emergency-share-page__inner">
        <header className="emergency-share__hero">
          <div className="emergency-share__hero-icon" aria-hidden>
            <span>+</span>
          </div>
          <div>
            <p className="emergency-share__eyebrow">KEMIX Emergency</p>
            <h1 className="emergency-share__title">응급 의료 정보</h1>
            <p className="emergency-share__subtitle">
              QR 스캔으로 연결된 공개 응급 프로필입니다. 구급대원·보호자 전용 화면입니다.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="emergency-share__card emergency-share__card--muted">
            <p>응급 정보를 불러오는 중…</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="emergency-share__card emergency-share__card--error">
            <p>{error}</p>
          </div>
        ) : null}

        {!loading && !error && !record ? (
          <div className="emergency-share__card emergency-share__card--error">
            <p>등록된 응급 정보를 찾을 수 없습니다.</p>
            <p className="emergency-share__hint">
              QR이 만료되었거나 아직 앱에서 저장·동기화되지 않았을 수 있습니다.
            </p>
          </div>
        ) : null}

        {!loading && !error && record && payload ? (
          <article className="emergency-share__card">
            {payload.fullName?.trim() ? (
              <h2 className="emergency-share__name">{payload.fullName.trim()}</h2>
            ) : null}

            {!hasPayloadContent(payload) ? (
              <p className="emergency-share__hint">표시할 응급 정보가 비어 있습니다.</p>
            ) : (
              <>
                <ContactBlock
                  label="비상 연락 1"
                  name={payload.contact1Name}
                  phone={payload.contact1Phone}
                />
                <ContactBlock
                  label="비상 연락 2"
                  name={payload.contact2Name}
                  phone={payload.contact2Phone}
                />
                <NoteBlock label="알레르기 · 복용 약물" value={payload.allergiesMedications} />
                <NoteBlock label="선호 응급 병원" value={payload.preferredHospital} />
                <NoteBlock label="응급 의료 메모" value={payload.medicalNotes} />
              </>
            )}

            {record.updated_at ? (
              <p className="emergency-share__updated">
                최종 업데이트: {formatUpdatedAt(record.updated_at)}
              </p>
            ) : null}
          </article>
        ) : null}

        <footer className="emergency-share__footer">
          <p>
            이 정보는 환자가 KEMIX 앱에 직접 등록한 응급 의료 카드입니다. 오용·무단 공유를
            삼가 주세요.
          </p>
          <Link to="/">KEMIX 홈으로</Link>
        </footer>
      </div>
    </div>
  );
}
