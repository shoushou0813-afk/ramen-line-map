import { describe, it, expect } from "vitest";
import {
  addDays,
  countdownLabel,
  diffDays,
  formatMD,
  formatMDW,
  parseDateKey,
  startOfWeek,
  toDateKey,
  toMinutes,
  toTimeLabel,
  weekDateKeys,
} from "./date.js";

describe("date.js", () => {
  it("日付キーをローカル時間として読む（UTCずれを起こさない）", () => {
    const d = parseDateKey("2026-09-16");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // 0始まりなので9月は8
    expect(d.getDate()).toBe(16);
    expect(d.getHours()).toBe(0);
  });

  it("Dateと日付キーを往復しても変わらない", () => {
    expect(toDateKey(parseDateKey("2026-01-05"))).toBe("2026-01-05");
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("addDaysが月末・年末をまたいでも正しい", () => {
    expect(toDateKey(addDays(parseDateKey("2026-01-31"), 1))).toBe("2026-02-01");
    expect(toDateKey(addDays(parseDateKey("2026-12-31"), 1))).toBe("2027-01-01");
    expect(toDateKey(addDays(parseDateKey("2026-03-01"), -1))).toBe("2026-02-28");
  });

  it("startOfWeekは月曜を返し、日曜はその週の月曜に寄せる", () => {
    // 2026-09-16 は水曜
    expect(toDateKey(startOfWeek(parseDateKey("2026-09-16")))).toBe("2026-09-14");
    // 月曜自身は動かない
    expect(toDateKey(startOfWeek(parseDateKey("2026-09-14")))).toBe("2026-09-14");
    // 日曜は前の月曜（翌週の月曜にしない）
    expect(toDateKey(startOfWeek(parseDateKey("2026-09-20")))).toBe("2026-09-14");
  });

  it("weekDateKeysは月曜から日曜の7日分", () => {
    const keys = weekDateKeys(parseDateKey("2026-09-14"));
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe("2026-09-14");
    expect(keys[6]).toBe("2026-09-20");
  });

  it("toMinutesは時刻を分に直し、不正な値はnull", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("13:00")).toBe(780);
    expect(toMinutes("23:59")).toBe(1439);
    expect(toMinutes("")).toBeNull();
    expect(toMinutes(null)).toBeNull();
    expect(toMinutes("25:00")).toBeNull();
    expect(toMinutes("13:70")).toBeNull();
    expect(toMinutes("ごご1じ")).toBeNull();
  });

  it("toTimeLabelはtoMinutesの逆", () => {
    expect(toTimeLabel(780)).toBe("13:00");
    expect(toTimeLabel(5)).toBe("00:05");
    expect(toTimeLabel(null)).toBe("");
  });

  it("diffDaysは日数の差を返す", () => {
    expect(diffDays("2026-09-16", "2026-09-16")).toBe(0);
    expect(diffDays("2026-09-16", "2026-09-20")).toBe(4);
    expect(diffDays("2026-09-16", "2026-09-10")).toBe(-6);
    expect(diffDays("2026-02-27", "2026-03-02")).toBe(3);
  });

  it("表示用の書式", () => {
    expect(formatMD("2026-09-06")).toBe("9/6");
    expect(formatMDW("2026-09-16")).toBe("9/16(水)");
    expect(formatMDW("2026-09-20")).toBe("9/20(日)");
  });

  it("残り日数の文言", () => {
    expect(countdownLabel(0)).toBe("今日まで");
    expect(countdownLabel(1)).toBe("明日まで");
    expect(countdownLabel(5)).toBe("あと5日");
    expect(countdownLabel(-2)).toBe("2日超過");
  });
});
