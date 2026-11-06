import { useEffect, useMemo, useState } from "react";
import WeekTimetable from "./components/WeekTimetable";
import MonthCalendar from "./components/MonthCalendar";
import UpcomingPanel from "./components/UpcomingPanel";
import EventList from "./components/EventList";
import EventForm from "./components/EventForm";
import DataPanel from "./components/DataPanel";
import SheetImport from "./components/SheetImport";
import InstallHint from "./components/InstallHint";
import { EVENT_TYPES } from "./data/eventTypes";
import { loadEvents, saveEvents, newId } from "./lib/storage";
import { sampleEvents } from "./data/sample";
import {
  addDays,
  formatMD,
  startOfWeek,
  toDateKey,
  weekDateKeys,
} from "./lib/date";
import { addMonths, formatYearMonth, startOfMonth } from "./lib/month";

// 「時間割」だけ呼び方の種類が違うと、週と月を切り替えるタブだと読み取れない。
// 期間の単位で揃えている。
const MODES = [
  { id: "week", label: "週" },
  { id: "month", label: "月" },
  { id: "list", label: "リスト" },
];

/** 新規追加のときの初期値 */
function emptyEvent(date, start) {
  return {
    id: "",
    company: "",
    type: "briefing",
    date,
    start: start ?? "",
    end: "",
    place: "",
    memo: "",
    done: false,
  };
}

export default function ScheduleApp() {
  // 起動時に localStorage から読む。useState に関数を渡すと初回だけ実行されるので、
  // 再描画のたびに読み直さずに済む（「遅延初期化」と呼ばれる書き方）
  const [events, setEvents] = useState(() => loadEvents());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => toDateKey(new Date()));
  const [mode, setMode] = useState("week");
  const [editing, setEditing] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [showWeekend, setShowWeekend] = useState(false);

  // 種別の絞り込み。{ briefing: true, es: true, ... } の形で持つ
  const [visible, setVisible] = useState(() =>
    Object.fromEntries(EVENT_TYPES.map((t) => [t.id, true]))
  );

  const todayKey = toDateKey(new Date());

  // events が変わるたびに保存する。
  // useEffect は「描画が終わったあとに実行する処理」を登録する仕組みで、
  // 第2引数の配列に入れた値が変わったときだけ動く。
  useEffect(() => {
    saveEvents(events);
  }, [events]);

  const shown = useMemo(() => events.filter((e) => visible[e.type] !== false), [events, visible]);

  const listEvents = useMemo(
    () => (showPast ? shown : shown.filter((e) => e.date >= todayKey)),
    [shown, showPast, todayKey]
  );

  const weekKeys = weekDateKeys(weekStart);
  const lastKey = weekKeys[showWeekend ? 6 : 4];
  // 見出しに年月も出す。「9/14 〜 9/18」だけだと、週を送っていくうちに
  // 何月を見ているのか分からなくなる
  const weekLabel = `${formatYearMonth(weekStart)} ${formatMD(weekKeys[0])} 〜 ${formatMD(lastKey)}`;
  // 「今週」バッジは土日を隠していても週全体で判定する（今日が日曜でも今週は今週）
  const isThisWeek = weekKeys.includes(todayKey);

  const monthLabel = formatYearMonth(monthDate);
  const isThisMonth = monthLabel === formatYearMonth(new Date());

  /**
   * 月を送る。選んでいる日がその月の外に出たままだと、下の一覧が
   * 見えている月と食い違うので、選択も連れていく
   * （今日がその月にあれば今日、無ければ1日）。
   */
  function goMonth(offset) {
    setMonthDate((prev) => {
      const next = offset === 0 ? startOfMonth(new Date()) : addMonths(prev, offset);
      const today = new Date();
      const isSameMonth = formatYearMonth(next) === formatYearMonth(today);
      setSelectedDay(toDateKey(isSameMonth ? today : next));
      return next;
    });
  }

  function openNew(date, start) {
    setEditing(emptyEvent(date ?? todayKey, start));
  }

  function save(form) {
    setEvents((prev) => {
      if (form.id) return prev.map((e) => (e.id === form.id ? form : e));
      return [...prev, { ...form, id: newId() }];
    });
    setEditing(null);
  }

  function remove(id) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setEditing(null);
  }

  function toggleDone(id) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, done: !e.done } : e)));
  }

  return (
    <div className="page">
      <InstallHint />

      <header className="header">
        <h1 className="title">就活タイムテーブル</h1>
        <p className="lead">
          説明会・ES締切・面接を時間割の形で並べるアプリ。
          予定はこの端末のブラウザに保存されます。
        </p>

        <nav className="tabs">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={mode === m.id ? "tab is-active" : "tab"}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="card">
        <h2 className="card-title">締切ボード</h2>
        <UpcomingPanel events={shown} todayKey={todayKey} onSelect={setEditing} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">
            {mode === "week" && weekLabel}
            {mode === "month" && monthLabel}
            {mode === "list" && "予定一覧"}
            {mode === "week" && isThisWeek && <span className="today-badge">今週</span>}
            {mode === "month" && isThisMonth && <span className="today-badge">今月</span>}
          </h2>

          {mode === "month" ? (
            <div className="week-nav">
              <button className="button" onClick={() => goMonth(-1)}>
                ← 前月
              </button>
              <button className="button" onClick={() => goMonth(0)}>
                今月
              </button>
              <button className="button" onClick={() => goMonth(1)}>
                次月 →
              </button>
            </div>
          ) : mode === "week" ? (
            <div className="week-nav">
              <button className="button" onClick={() => setWeekStart((w) => addDays(w, -7))}>
                ← 前週
              </button>
              <button className="button" onClick={() => setWeekStart(startOfWeek(new Date()))}>
                今週
              </button>
              <button className="button" onClick={() => setWeekStart((w) => addDays(w, 7))}>
                次週 →
              </button>
              <button
                className={showWeekend ? "button is-on" : "button"}
                onClick={() => setShowWeekend((v) => !v)}
              >
                土日{showWeekend ? "あり" : "なし"}
              </button>
            </div>
          ) : (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={showPast}
                onChange={(e) => setShowPast(e.target.checked)}
              />
              <span>過去の予定も表示</span>
            </label>
          )}
        </div>

        {/* 種別フィルタ。押すと表示/非表示が切り替わる */}
        <div className="type-picker">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={visible[t.id] ? "type-chip is-active" : "type-chip"}
              style={
                visible[t.id]
                  ? { background: t.bg, borderColor: t.color, color: t.color }
                  : undefined
              }
              onClick={() => setVisible((prev) => ({ ...prev, [t.id]: !prev[t.id] }))}
            >
              {t.label}
            </button>
          ))}
        </div>

        {mode === "week" && (
          <WeekTimetable
            weekStart={weekStart}
            events={shown}
            todayKey={todayKey}
            showWeekend={showWeekend}
            onSelect={setEditing}
            onAddAt={openNew}
          />
        )}

        {mode === "month" && (
          <MonthCalendar
            monthDate={monthDate}
            events={shown}
            todayKey={todayKey}
            selectedKey={selectedDay}
            onSelectDay={setSelectedDay}
            onSelectEvent={setEditing}
            onAddAt={openNew}
          />
        )}

        {mode === "list" && (
          <EventList
            events={listEvents}
            todayKey={todayKey}
            onSelect={setEditing}
            onToggleDone={toggleDone}
          />
        )}

        {events.length === 0 && (
          <div className="empty-state">
            <p className="empty">まだ予定がありません。</p>
            <button className="button" onClick={() => setEvents(sampleEvents(new Date()))}>
              サンプルを入れてみる
            </button>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">エクセルから取り込む</h2>
        <SheetImport events={events} onImport={setEvents} />
      </section>

      <section className="card">
        <h2 className="card-title">データの持ち出し</h2>
        <DataPanel events={events} onImport={setEvents} />
      </section>

      {/* 画面右下に固定した追加ボタン。時間割の空きをクリックしても追加できる */}
      <button className="fab" onClick={() => openNew()} aria-label="予定を追加">
        ＋
      </button>

      {editing && (
        <EventForm
          initial={editing}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
