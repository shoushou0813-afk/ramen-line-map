import { monthGrid } from "../lib/month";
import { compareEvents } from "../lib/agenda";
import { WEEKDAY_LABELS, formatMDW, toMinutes, toTimeLabel } from "../lib/date";
import { typeOf } from "../data/eventTypes";

// 1つのマスに並べる印の数。これを超えたら「+2」のようにまとめる
const MAX_DOTS = 4;

/**
 * 月のカレンダー。
 *
 * 週の時間割では「今月どのあたりに締切が固まっているか」が見えないので、
 * 1か月を一覧できる表示を用意した。
 * マスの中は印だけにして、選んだ日の中身は下に出す。
 * スマホでは1マスが50px程度しかなく、企業名を入れても読めないため。
 */
export default function MonthCalendar({
  monthDate,
  events,
  todayKey,
  selectedKey,
  onSelectDay,
  onSelectEvent,
  onAddAt,
}) {
  // 日付ごとにまとめてから並べ替える（マスごとに全件を走査しないで済む）
  const byDate = {};
  for (const e of events) {
    (byDate[e.date] ??= []).push(e);
  }
  for (const list of Object.values(byDate)) list.sort(compareEvents);

  const weeks = monthGrid(monthDate);
  const selected = byDate[selectedKey] ?? [];

  return (
    <div className="month">
      <div className="month-head">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="month-weekday">
            {w}
          </div>
        ))}
      </div>

      <div className="month-grid">
        {weeks.flat().map((cell) => {
          const dayEvents = byDate[cell.key] ?? [];
          const classes = ["month-cell"];
          if (!cell.inMonth) classes.push("is-outside");
          if (cell.key === todayKey) classes.push("is-today");
          if (cell.key === selectedKey) classes.push("is-selected");

          return (
            <button
              key={cell.key}
              type="button"
              className={classes.join(" ")}
              onClick={() => onSelectDay(cell.key)}
              aria-label={`${formatMDW(cell.key)} 予定${dayEvents.length}件`}
            >
              <span className="month-day">{cell.day}</span>
              <span className="month-dots">
                {dayEvents.slice(0, MAX_DOTS).map((e) => (
                  <span
                    key={e.id}
                    className={e.done ? "month-dot is-done" : "month-dot"}
                    style={{ background: typeOf(e.type).color }}
                  />
                ))}
                {dayEvents.length > MAX_DOTS && (
                  <span className="month-more">+{dayEvents.length - MAX_DOTS}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="month-day-panel">
        <h3 className="month-day-title">
          {formatMDW(selectedKey)}
          {selectedKey === todayKey && <span className="today-badge">今日</span>}
        </h3>

        {selected.length === 0 ? (
          <p className="empty">この日の予定はありません。</p>
        ) : (
          <ul className="month-day-list">
            {selected.map((e) => {
              const type = typeOf(e.type);
              const start = toMinutes(e.start);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className={e.done ? "month-day-item is-done" : "month-day-item"}
                    onClick={() => onSelectEvent(e)}
                  >
                    <span className="month-day-time">
                      {start != null ? toTimeLabel(start) : "時間未定"}
                    </span>
                    <span className="month-day-company">{e.company}</span>
                    <span
                      className="month-day-type"
                      style={{ background: type.bg, color: type.color }}
                    >
                      {type.label}
                    </span>
                    {e.place && <span className="month-day-place">{e.place}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <button className="button" onClick={() => onAddAt(selectedKey)}>
          この日に予定を追加
        </button>
      </div>
    </div>
  );
}
