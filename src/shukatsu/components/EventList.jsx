import { groupByDate } from "../lib/agenda";
import { formatMDW, toMinutes, toTimeLabel } from "../lib/date";
import { typeOf } from "../data/eventTypes";

/**
 * 一覧表示。時間割は週をまたぐと見えなくなるので、
 * 「全部まとめて上から下に見たい」ときのためのタブ。
 */
export default function EventList({ events, todayKey, onSelect, onToggleDone }) {
  const groups = groupByDate(events);

  if (groups.length === 0) {
    return <p className="empty">表示できる予定がありません。</p>;
  }

  return (
    <div className="list">
      {groups.map((group) => (
        <section key={group.date} className="list-group">
          <h3 className={group.date === todayKey ? "list-date is-today" : "list-date"}>
            {formatMDW(group.date)}
            {group.date === todayKey && <span className="today-badge">今日</span>}
          </h3>
          <ul className="list-items">
            {group.events.map((e) => {
              const type = typeOf(e.type);
              const start = toMinutes(e.start);
              return (
                <li key={e.id} className={e.done ? "list-item is-done" : "list-item"}>
                  <input
                    type="checkbox"
                    className="list-check"
                    checked={!!e.done}
                    onChange={() => onToggleDone(e.id)}
                    aria-label="提出・参加済みにする"
                  />
                  <button type="button" className="list-body" onClick={() => onSelect(e)}>
                    <span className="list-time">
                      {start != null ? toTimeLabel(start) : "時間未定"}
                    </span>
                    <span className="list-company">{e.company}</span>
                    <span className="list-type" style={{ background: type.bg, color: type.color }}>
                      {type.label}
                    </span>
                    {e.place && <span className="list-place">{e.place}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
