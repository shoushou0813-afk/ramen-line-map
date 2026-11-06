import { describe, it, expect } from "vitest";
import { compareEvents, groupByDate, selectUpcoming } from "./agenda.js";

const ev = (id, date, type, start = "", done = false) => ({
  id,
  company: id,
  date,
  type,
  start,
  end: "",
  done,
});

describe("compareEvents", () => {
  it("日付、次に時刻の順に並ぶ", () => {
    const list = [
      ev("c", "2026-09-17", "briefing", "09:00"),
      ev("b", "2026-09-16", "briefing", "15:00"),
      ev("a", "2026-09-16", "briefing", "09:00"),
    ].sort(compareEvents);
    expect(list.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("時刻未定は同じ日の中で最後に来る", () => {
    const list = [
      ev("none", "2026-09-16", "es", ""),
      ev("late", "2026-09-16", "briefing", "23:00"),
    ].sort(compareEvents);
    expect(list.map((e) => e.id)).toEqual(["late", "none"]);
  });
});

describe("selectUpcoming", () => {
  const today = "2026-09-16";

  it("期限切れの締切だけを取り出す", () => {
    const { overdue } = selectUpcoming(
      [
        ev("es-past", "2026-09-10", "es"),
        ev("briefing-past", "2026-09-10", "briefing"), // 締切系でないので出さない
        ev("es-future", "2026-09-20", "es"),
      ],
      today
    );
    expect(overdue.map((r) => r.event.id)).toEqual(["es-past"]);
    expect(overdue[0].days).toBe(-6);
  });

  it("完了済みは期限切れにもこれからにも出さない", () => {
    const { overdue, soon } = selectUpcoming(
      [ev("done-past", "2026-09-10", "es", "", true), ev("done-soon", "2026-09-18", "es", "", true)],
      today
    );
    expect(overdue).toHaveLength(0);
    expect(soon).toHaveLength(0);
  });

  it("指定日数より先の予定は含めない", () => {
    const { soon } = selectUpcoming(
      [ev("in", "2026-09-30", "briefing"), ev("out", "2026-10-01", "briefing")],
      today,
      14
    );
    expect(soon.map((r) => r.event.id)).toEqual(["in"]);
  });

  it("今日の予定はこれからに入る", () => {
    const { soon } = selectUpcoming([ev("today", today, "interview", "10:00")], today);
    expect(soon).toHaveLength(1);
    expect(soon[0].days).toBe(0);
  });
});

describe("groupByDate", () => {
  it("同じ日付をまとめ、日付順に並べる", () => {
    const groups = groupByDate([
      ev("b", "2026-09-16", "briefing", "15:00"),
      ev("c", "2026-09-17", "briefing", "09:00"),
      ev("a", "2026-09-16", "briefing", "09:00"),
    ]);
    expect(groups.map((g) => g.date)).toEqual(["2026-09-16", "2026-09-17"]);
    expect(groups[0].events.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("空配列なら空配列", () => {
    expect(groupByDate([])).toEqual([]);
  });
});
