import { useEffect, useMemo, useState } from 'react';
import { KemixCalendar } from '../../components/KemixCalendar';
import { ScheduleDetailModal } from '../../components/ScheduleDetailModal';
import type { KemixSchedule } from '../../types';
import { fetchSchedulesInRange, formatDisplayDate } from '../../services/scheduleService';

export function SchedulePage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [schedules, setSchedules] = useState<KemixSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<KemixSchedule | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ date: Date; items: KemixSchedule[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = new Date(viewYear, viewMonth, 1);
    const end = new Date(viewYear, viewMonth + 1, 0);
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchSchedulesInRange(start, end);
        if (!cancelled) setSchedules(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '일정을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewYear, viewMonth]);

  const upcoming = useMemo(
    () =>
      [...schedules]
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, 6),
    [schedules],
  );

  return (
    <div className="content-section">
      <header className="content-section-head">
        <h2 className="content-section-title">KEMIX 일정</h2>
        <p className="muted">학술대회, 교육일자, 행사 등 주요 일정을 달력에서 확인하세요.</p>
      </header>

      {loading ? <p className="muted">일정을 불러오는 중…</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <KemixCalendar
        schedules={schedules}
        year={viewYear}
        month={viewMonth}
        onMonthChange={(y, m) => {
          setViewYear(y);
          setViewMonth(m);
        }}
        onSelectDate={(date, items) => {
          if (items.length === 1) {
            setSelectedSchedule(items[0]);
            setSelectedDay(null);
          } else if (items.length > 1) {
            setSelectedDay({ date, items });
            setSelectedSchedule(null);
          } else {
            setSelectedDay({ date, items: [] });
            setSelectedSchedule(null);
          }
        }}
        onSelectSchedule={setSelectedSchedule}
      />

      {!loading && upcoming.length > 0 ? (
        <section className="schedule-upcoming" aria-label="이번 달 주요 일정">
          <h3>이번 달 주요 일정</h3>
          <ul className="schedule-upcoming-list">
            {upcoming.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="schedule-upcoming-item"
                  onClick={() => setSelectedSchedule(item)}
                >
                  <span className="schedule-upcoming-dot" style={{ backgroundColor: item.tag_color }} />
                  <span className="schedule-upcoming-date">{formatDisplayDate(item.start_date)}</span>
                  <span className="schedule-upcoming-title">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!loading && !error && schedules.length === 0 ? (
        <p className="muted">등록된 일정이 없습니다.</p>
      ) : null}

      <ScheduleDetailModal schedule={selectedSchedule} onClose={() => setSelectedSchedule(null)} />

      {selectedDay ? (
        <div className="modal-overlay" role="presentation" onClick={() => setSelectedDay(null)}>
          <div
            className="modal-dialog schedule-day-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="schedule-detail-modal-header">
              <h2 className="schedule-detail-title">
                {formatDisplayDate(
                  `${selectedDay.date.getFullYear()}-${String(selectedDay.date.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.date.getDate()).padStart(2, '0')}`,
                )}{' '}
                일정
              </h2>
              <button type="button" className="modal-close" onClick={() => setSelectedDay(null)} aria-label="닫기">
                ×
              </button>
            </div>
            {selectedDay.items.length === 0 ? (
              <p className="muted">이 날짜에 등록된 일정이 없습니다.</p>
            ) : (
              <ul className="schedule-day-list">
                {selectedDay.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="schedule-day-list-item"
                      onClick={() => {
                        setSelectedDay(null);
                        setSelectedSchedule(item);
                      }}
                    >
                      <span className="schedule-upcoming-dot" style={{ backgroundColor: item.tag_color }} />
                      <span>{item.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
