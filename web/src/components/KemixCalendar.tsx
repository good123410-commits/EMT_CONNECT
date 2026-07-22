import { useMemo } from 'react';
import type { KemixSchedule } from '../types';
import { formatDateParam, groupSchedulesByDate, toDateKey } from '../services/scheduleService';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type KemixCalendarProps = {
  schedules: KemixSchedule[];
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  onSelectDate: (date: Date, daySchedules: KemixSchedule[]) => void;
  onSelectSchedule: (schedule: KemixSchedule) => void;
};

export function KemixCalendar({
  schedules,
  year,
  month,
  onMonthChange,
  onSelectDate,
  onSelectSchedule,
}: KemixCalendarProps) {
  const today = new Date();
  const byDate = useMemo(() => groupSchedulesByDate(schedules), [schedules]);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((startPad + daysInMonth) / 7) * 7;
    const result: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < total; i++) {
      const day = i - startPad + 1;
      if (day < 1 || day > daysInMonth) {
        result.push({ date: null, key: `empty-${i}` });
      } else {
        const date = new Date(year, month, day);
        result.push({ date, key: toDateKey(date) });
      }
    }
    return result;
  }, [year, month]);

  const goPrev = () => {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  };

  const goNext = () => {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  };

  return (
    <div className="kemix-calendar">
      <div className="kemix-calendar-header">
        <button type="button" className="kemix-calendar-nav" onClick={goPrev} aria-label="이전 달">
          ‹
        </button>
        <h2 className="kemix-calendar-title">
          {year}년 {month + 1}월
        </h2>
        <button type="button" className="kemix-calendar-nav" onClick={goNext} aria-label="다음 달">
          ›
        </button>
      </div>

      <div className="kemix-calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="kemix-calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="kemix-calendar-grid">
        {cells.map((cell) => {
          if (!cell.date) {
            return <div key={cell.key} className="kemix-calendar-cell kemix-calendar-cell--empty" />;
          }

          const daySchedules = byDate.get(cell.key) ?? [];
          const isToday = formatDateParam(cell.date) === formatDateParam(today);
          const uniqueSchedules = [...new Map(daySchedules.map((s) => [s.id, s])).values()];

          return (
            <button
              key={cell.key}
              type="button"
              className={`kemix-calendar-cell${isToday ? ' kemix-calendar-cell--today' : ''}${uniqueSchedules.length ? ' kemix-calendar-cell--has-events' : ''}`}
              onClick={() => onSelectDate(cell.date!, uniqueSchedules)}
            >
              <span className="kemix-calendar-day">{cell.date.getDate()}</span>
              {uniqueSchedules.length > 0 ? (
                <div className="kemix-calendar-tags">
                  {uniqueSchedules.slice(0, 3).map((schedule) => (
                    <span
                      key={schedule.id}
                      className="kemix-calendar-tag"
                      style={{ backgroundColor: schedule.tag_color }}
                      title={schedule.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSchedule(schedule);
                      }}
                    />
                  ))}
                  {uniqueSchedules.length > 3 ? (
                    <span className="kemix-calendar-more">+{uniqueSchedules.length - 3}</span>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
