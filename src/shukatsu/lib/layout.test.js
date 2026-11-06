import { describe, it, expect } from "vitest";
import { assignLanes, layoutDay, resolveRange } from "./layout.js";

const ev = (id, start, end, type = "briefing") => ({ id, start, end, type, company: id });

describe("resolveRange", () => {
  it("開始時刻がなければnull（時間未定あつかい）", () => {
    expect(resolveRange(ev("a", "", ""))).toBeNull();
  });

  it("終了時刻があればそのまま使う", () => {
    expect(resolveRange(ev("a", "13:00", "14:30"))).toEqual({ startMin: 780, endMin: 870 });
  });

  it("終了時刻がなければ種別ごとの既定の長さを足す", () => {
    expect(resolveRange(ev("a", "13:00", "", "briefing")).endMin).toBe(780 + 90);
    expect(resolveRange(ev("a", "13:00", "", "es")).endMin).toBe(780 + 30);
    expect(resolveRange(ev("a", "13:00", "", "interview")).endMin).toBe(780 + 60);
  });

  it("終了が開始以前なら既定の長さで補正する", () => {
    expect(resolveRange(ev("a", "13:00", "12:00", "interview")).endMin).toBe(840);
  });

  it("24時を超えない", () => {
    expect(resolveRange(ev("a", "23:59", "", "es")).endMin).toBe(1440);
  });
});

describe("assignLanes", () => {
  it("重ならない予定は1列のまま", () => {
    const out = assignLanes([
      { id: "a", startMin: 600, endMin: 660 },
      { id: "b", startMin: 700, endMin: 760 },
    ]);
    expect(out.map((o) => [o.id, o.lane, o.lanes])).toEqual([
      ["a", 0, 1],
      ["b", 0, 1],
    ]);
  });

  it("重なる2件は2列に分かれる", () => {
    const out = assignLanes([
      { id: "a", startMin: 600, endMin: 700 },
      { id: "b", startMin: 650, endMin: 750 },
    ]);
    expect(out.find((o) => o.id === "a")).toMatchObject({ lane: 0, lanes: 2 });
    expect(out.find((o) => o.id === "b")).toMatchObject({ lane: 1, lanes: 2 });
  });

  it("終わった予定のレーンは次の予定が再利用する", () => {
    // a: 10:00-11:00, b: 10:30-12:00, c: 11:00-12:00
    // cはaと重ならないのでレーン0に入り、分割数は3ではなく2になる
    const out = assignLanes([
      { id: "a", startMin: 600, endMin: 660 },
      { id: "b", startMin: 630, endMin: 720 },
      { id: "c", startMin: 660, endMin: 720 },
    ]);
    expect(out.find((o) => o.id === "c")).toMatchObject({ lane: 0, lanes: 2 });
    expect(out.every((o) => o.lanes === 2)).toBe(true);
  });

  it("かたまりが切れると分割数は元に戻る", () => {
    const out = assignLanes([
      { id: "a", startMin: 600, endMin: 700 },
      { id: "b", startMin: 650, endMin: 750 },
      { id: "c", startMin: 800, endMin: 860 },
    ]);
    expect(out.find((o) => o.id === "c")).toMatchObject({ lane: 0, lanes: 1 });
  });

  it("接している予定（前の終了＝次の開始）は重なりとみなさない", () => {
    const out = assignLanes([
      { id: "a", startMin: 600, endMin: 660 },
      { id: "b", startMin: 660, endMin: 720 },
    ]);
    expect(out.every((o) => o.lanes === 1)).toBe(true);
  });

  it("元の配列を書き換えない", () => {
    const input = [{ id: "a", startMin: 600, endMin: 660 }];
    assignLanes(input);
    expect(input[0]).toEqual({ id: "a", startMin: 600, endMin: 660 });
  });
});

describe("layoutDay", () => {
  it("時間未定のものは終日エリアに回す", () => {
    const { timed, allDay } = layoutDay([ev("a", "", ""), ev("b", "10:00", "11:00")], 8, 22);
    expect(allDay.map((e) => e.id)).toEqual(["a"]);
    expect(timed.map((t) => t.id)).toEqual(["b"]);
  });

  it("表示範囲外の予定も終日エリアに逃がす", () => {
    const { timed, allDay } = layoutDay([ev("early", "05:00", "06:00")], 8, 22);
    expect(timed).toHaveLength(0);
    expect(allDay.map((e) => e.id)).toEqual(["early"]);
  });

  it("範囲をまたぐ予定は端で切り詰める", () => {
    // 21:00-23:00 の予定は 21:00-22:00 として表示する
    const { timed } = layoutDay([ev("late", "21:00", "23:00")], 8, 22);
    expect(timed[0]).toMatchObject({ startMin: 21 * 60, endMin: 22 * 60 });
  });

  it("位置と高さを%で返す", () => {
    // 8-22時の14時間が100%。10:00-11:00 は上から2時間目、長さ1時間
    const { timed } = layoutDay([ev("a", "10:00", "11:00")], 8, 22);
    expect(timed[0].topPct).toBeCloseTo((2 / 14) * 100);
    expect(timed[0].heightPct).toBeCloseTo((1 / 14) * 100);
    expect(timed[0].leftPct).toBe(0);
    expect(timed[0].widthPct).toBe(100);
  });

  it("重なると横幅が半分になる", () => {
    const { timed } = layoutDay([ev("a", "10:00", "11:00"), ev("b", "10:30", "11:30")], 8, 22);
    expect(timed.map((t) => t.widthPct)).toEqual([50, 50]);
    expect(timed.map((t) => t.leftPct)).toEqual([0, 50]);
  });
});
