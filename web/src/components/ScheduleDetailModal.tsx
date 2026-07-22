import type { KemixSchedule } from '../types';
import { formatDisplayDate, formatScheduleRange } from '../services/scheduleService';

type ScheduleDetailModalProps = {
  schedule: KemixSchedule | null;
  onClose: () => void;
};

export function ScheduleDetailModal({ schedule, onClose }: ScheduleDetailModalProps) {
  if (!schedule) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog schedule-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="schedule-detail-modal-header">
          <span className="schedule-detail-tag" style={{ backgroundColor: schedule.tag_color }}>
            일정
          </span>
          <button type="button" className="modal-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <h2 id="schedule-modal-title" className="schedule-detail-title">
          {schedule.title}
        </h2>
        <dl className="schedule-detail-meta">
          <div>
            <dt>기간</dt>
            <dd>{formatScheduleRange(schedule.start_date, schedule.end_date)}</dd>
          </div>
          {schedule.location ? (
            <div>
              <dt>장소</dt>
              <dd>{schedule.location}</dd>
            </div>
          ) : null}
          <div>
            <dt>등록일</dt>
            <dd>{formatDisplayDate(schedule.start_date)}</dd>
          </div>
        </dl>
        {schedule.description ? (
          <div className="schedule-detail-body">
            <p>{schedule.description}</p>
          </div>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
