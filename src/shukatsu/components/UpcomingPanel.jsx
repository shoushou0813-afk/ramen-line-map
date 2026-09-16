import { selectUpcoming } from "../lib/agenda";
import { countdownLabel, formatMDW, toTimeLabel, toMinutes } from "../lib/date";
import { typeOf } from "../data/eventTypes";

/**
 * 画面上部の「締切ボード」。
 * 時間割は週単位なので、来週以降の締切が視界から消える。それを補うために
 * 未完了の予定だけを期限順に並べ、残り日数を大きく出している。
 */
export default function UpcomingPanel({ events, todayKey, onSelect }) {
  const { overdue, soon } = selectUpcoming(events, todayKey, 14);

  if (overdue.length === 0 && soon.length === 0) {
    return <p className="empty">2週間以内の未完了の予定はありません。</p>;
  }

  return (
    <div className="upcoming">
      {overdue.length > 0 && (
        <div className="upcoming-group">
          <h3 className="upcoming-head is-overdue">期限切れ（未提出）</h3>
          <ul className="upcoming-list">
            {overdue.map((row) => (
              <Row key={row.event.id} row={row} onSelect={onSelect} overdue />
            ))}
          </ul>
        </div>
      )}

      {soon.length > 0 && (
        <div className="upcoming-group">
          <h3 className="upcoming-head">これから2週間</h3>
          <ul className="upcoming-list">
            {soon.map((row) => (
              <Row key={row.event.id} row={row} onSelect={onSelect} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ row, onSelect, overdue }) {
  const { event, days } = row;
  const type = typeOf(event.type);
  const start = toMinutes(event.start);

  // 3日以内は色を変えて目立たせる
  const urgent = !overdue && days <= 3;

  return (
    <li>
      <button type="button" className="upcoming-item" onClick={() => onSelect(event)}>
        <span
          className={
            overdue
              ? "countdown is-overdue"
              : urgent
                ? "countdown is-urgent"
                : "countdown"
          }
        >
          {countdownLabel(days)}
        </span>
        <span className="upcoming-main">
          <span className="upcoming-company">{event.company}</span>
          <span className="upcoming-meta">
            <span className="type-dot" style={{ background: type.color }} />
            {type.label} ・ {formatMDW(event.date)}
            {start != null && ` ${toTimeLabel(start)}`}
          </span>
        </span>
      </button>
    </li>
  );
}
