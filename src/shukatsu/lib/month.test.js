import { describe, it, expect } from "vitest";
import { addMonths, endOfMonth, formatYearMonth, monthGrid, startOfMonth } from "./month.js";
import { toDateKey } from "./date.js";

describe("startOfMonth / endOfMonth", () => {
  it("月の初日と末日を返す", () => {
    expect(toDateKey(startOfMonth(new Date(2026, 8, 16)))).toBe("2026-09-01");
    expect(toDateKey(endOfMonth(new Date(2026, 8, 16)))).toBe("2026-09-30");
  });

  it("月ごとの日数の違いとうるう年を扱える", () => {
    expect(toDateKey(endOfMonth(new Date(2026, 1, 5)))).toBe("2026-02-28");
    expect(toDateKey(endOfMonth(new Date(2028, 1, 5)))).toBe("2028-02-29"); // うるう年
    expect(toDateKey(endOfMonth(new Date(2026, 11, 5)))).toBe("2026-12-31");
  });
});

describe("addMonths", () => {
  it("前後の月の1日を返す", () => {
    expect(toDateKey(addMonths(new Date(2026, 8, 16), 1))).toBe("2026-10-01");
    expect(toDateKey(addMonths(new Date(2026, 8, 16), -1))).toBe("2026-08-01");
  });

  it("年をまたいでも正しい", () => {
    expect(toDateKey(addMonths(new Date(2026, 11, 10), 1))).toBe("2027-01-01");
    expect(toDateKey(addMonths(new Date(2026, 0, 10), -1))).toBe("2025-12-01");
  });

  it("31日から進めても月が飛ばない", () => {
    // 1月31日の1か月後を「同じ日」で作ると、2月31日＝3月3日に繰り上がってしまう
    expect(toDateKey(addMonths(new Date(2026, 0, 31), 1))).toBe("2026-02-01");
  });
});

describe("formatYearMonth", () => {
  it("年と月を日本語で返す", () => {
    expect(formatYearMonth(new Date(2026, 8, 1))).toBe("2026年9月");
    expect(formatYearMonth(new Date(2027, 0, 1))).toBe("2027年1月");
  });
});

describe("monthGrid", () => {
  it("月曜始まりの7日ぶんの週で埋まる", () => {
    const weeks = monthGrid(new Date(2026, 8, 1));
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    // 2026年9月1日は火曜。週の先頭は8月31日（月）になる
    expect(weeks[0][0].key).toBe("2026-08-31");
    expect(weeks[0][0].inMonth).toBe(false);
    expect(weeks[0][1].key).toBe("2026-09-01");
    expect(weeks[0][1].inMonth).toBe(true);
  });

  it("その月の日をすべて含む", () => {
    const keys = monthGrid(new Date(2026, 8, 1))
      .flat()
      .filter((d) => d.inMonth)
      .map((d) => d.key);
    expect(keys).toHaveLength(30);
    expect(keys[0]).toBe("2026-09-01");
    expect(keys[29]).toBe("2026-09-30");
  });

  it("月末の翌日以降は並べない（余分な週を作らない）", () => {
    // 2026年8月は土曜始まり・31日まで。6週ではなく必要な週数で収まる
    const weeks = monthGrid(new Date(2026, 7, 1));
    expect(weeks.length).toBeLessThanOrEqual(6);
    const lastWeek = weeks[weeks.length - 1];
    expect(lastWeek.some((d) => d.inMonth)).toBe(true);
  });

  it("31日が日曜で終わる月でも6週に収まる", () => {
    const weeks = monthGrid(new Date(2026, 4, 1)); // 2026年5月
    expect(weeks.length).toBeLessThanOrEqual(6);
    expect(weeks.flat().filter((d) => d.inMonth)).toHaveLength(31);
  });

  it("日付が連続していて抜けや重複がない", () => {
    const keys = monthGrid(new Date(2026, 8, 1)).flat().map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort()).toEqual(keys);
  });
});
