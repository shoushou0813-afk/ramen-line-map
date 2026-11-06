import { layoutDay } from "../lib/layout";
import { typeOf } from "../data/eventTypes";
import {
  WEEKDAY_LABELS,
  addDays,
  formatMD,
  toDateKey,
  toMinutes,
  toTimeLabel,
} from "../lib/date";

// 時間割に表示する時間帯と、1時間あたりの高さ（px）。
// 8時〜22時にしているのは、説明会も面接もだいたいこの中に収まるため。
const START_HOUR = 8;
const END_HOUR = 22;
const HOUR_PX = 52;

/**
 * 週の時間割。
 *
 * 縦＝時間、横＝曜日のグリッドを作り、予定を「上からの%」「高さ%」で
 * 絶対配置している。マス目に流し込む方式にしなかったのは、
 * 13:00-14:30 のような30分刻みでない予定や、時間が重なる予定を
 * きれいに置けないため。
 */
export default function WeekTimetable({
  weekStart,
  events,
  todayKey,
  showWeekend,
  onSelect,
  onAddAt,
}) {
  // 土日を隠すと5列になり、スマホでも横スクロールなしで収まりやすくなる
  const dayCount = showWeekend ? 7 : 5;
  const columns = { gridTemplateColumns: `44px repeat(${dayCount}, 1fr)` };
  const hours = [];
  for (let h = START_HOUR; h < END_HOUR; h += 1) hours.push(h);
  const bodyHeight = (END_HOUR - START_HOUR) * HOUR_PX;

  // 日付キー → その日の予定、にまとめ直す（毎日フィルタすると7回走査することになる）
  const byDate = {};
  for (const e of events) {
    (byDate[e.date] ??= []).push(e);
  }

  const days = Array.from({ length: dayCount }, (_, i) => {
    const date = addDays(weekStart, i);
    const key = toDateKey(date);
    return {
      key,
      weekday: WEEKDAY_LABELS[i],
      md: formatMD(key),
      isToday: key === todayKey,
      ...layoutDay(byDate[key] ?? [], START_HOUR, END_HOUR),
    };
  });

  // 空いているところをクリックしたら、その時刻で新規追加を始める。
  // クリック位置（画面の上端からのpx）から列の上端を引くと、列内での位置が出る。
  function handleColumnClick(e, dateKey) {
    if (!onAddAt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const minutes = START_HOUR * 60 + ratio * (END_HOUR - START_HOUR) * 60;
    // 30分単位に丸める。Math.floor(x / 30) * 30 で「30の倍数に切り下げ」になる
    const snapped = Math.max(START_HOUR * 60, Math.floor(minutes / 30) * 30);
    onAddAt(dateKey, toTimeLabel(snapped));
  }

  return (
    <div className="tt-scroll">
      <div className="tt" style={{ minWidth: dayCount === 7 ? 560 : 360 }}>
        <div className="tt-row tt-head" style={columns}>
          <div className="tt-gutter-cell" />
          {days.map((d) => (
            <div key={d.key} className={d.isToday ? "tt-day-head is-today" : "tt-day-head"}>
              <span className="tt-weekday">{d.weekday}</span>
              <span className="tt-md">{d.md}</span>
            </div>
          ))}
        </div>

        {/* 時間が決まっていない予定（ES締切で時刻未記載など）を置く帯 */}
        <div className="tt-row tt-allday" style={columns}>
          <div className="tt-gutter-cell tt-allday-label" title="終日・時間未定・時間割の範囲外">
            終日
          </div>
          {days.map((d) => (
            <div key={d.key} className="tt-allday-cell">
              {d.allDay.map((e) => (
                <EventChip key={e.id} event={e} onSelect={onSelect} />
              ))}
            </div>
          ))}
        </div>

        <div className="tt-row tt-body" style={columns}>
          <div className="tt-gutter" style={{ height: bodyHeight }}>
            {hours.map((h) => (
              <div key={h} className="tt-hour" style={{ height: HOUR_PX }}>
                {h}:00
              </div>
            ))}
          </div>

          {days.map((d) => (
            <div
              key={d.key}
              className={d.isToday ? "tt-col is-today" : "tt-col"}
              style={{ height: bodyHeight, "--hour-px": `${HOUR_PX}px` }}
              onClick={(e) => handleColumnClick(e, d.key)}
            >
              {d.timed.map((p) => {
                const type = typeOf(p.event.type);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={p.event.done ? "tt-event is-done" : "tt-event"}
                    style={{
                      top: `${p.topPct}%`,
                      height: `${p.heightPct}%`,
                      left: `${p.leftPct}%`,
                      width: `${p.widthPct}%`,
                      background: type.bg,
                      borderColor: type.color,
                      color: type.color,
                    }}
                    onClick={(e) => {
                      // 列のクリック（＝新規追加）まで伝わらないように止める
                      e.stopPropagation();
                      onSelect(p.event);
                    }}
                  >
                    <span className="tt-event-time">{toTimeLabel(p.startMin)}</span>
                    <span className="tt-event-company">{p.event.company}</span>
                    <span className="tt-event-type">{type.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 終日エリア用の小さいチップ */
function EventChip({ event, onSelect }) {
  const type = typeOf(event.type);
  // 23:59 の ES 締切など、時刻はあるが時間割の範囲外のものはここに来る。
  // 時刻を落とすと「時間が分からない予定」に見えてしまうので、あれば併記する。
  const start = toMinutes(event.start);
  return (
    <button
      type="button"
      className={event.done ? "tt-chip is-done" : "tt-chip"}
      style={{ background: type.bg, borderColor: type.color, color: type.color }}
      onClick={() => onSelect(event)}
      title={`${type.label} ${event.company}`}
    >
      {type.short} {event.company}
      {start != null && ` ${toTimeLabel(start)}`}
    </button>
  );
}
