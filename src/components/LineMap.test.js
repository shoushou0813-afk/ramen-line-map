import { describe, it, expect } from "vitest";
import { buildSegments, labelAttrs, R } from "./LineMap";
import { LINES, LINE_ORDER } from "../data/lines";

describe("buildSegments", () => {
  it("隣り合う駅を順に結ぶ", () => {
    const line = {
      loop: false,
      stations: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 100, y: 0 },
        { id: "c", x: 200, y: 0 },
      ],
    };
    expect(buildSegments(line)).toEqual([
      { key: "a-b", points: "0,0 100,0" },
      { key: "b-c", points: "100,0 200,0" },
    ]);
  });

  it("corner があるとそこで一度折れる（斜め線にしない）", () => {
    const line = {
      loop: false,
      stations: [
        { id: "a", x: 0, y: 0, corner: [100, 0] },
        { id: "b", x: 100, y: 50 },
      ],
    };
    expect(buildSegments(line)[0].points).toBe("0,0 100,0 100,50");
  });

  it("loop なら最後の駅と最初の駅も結ぶ", () => {
    const line = {
      loop: true,
      stations: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 100, y: 0 },
      ],
    };
    const segments = buildSegments(line);
    expect(segments).toHaveLength(2);
    expect(segments[1]).toEqual({ key: "b-a-loop", points: "100,0 0,0" });
  });

  it("駅が1つだけなら線を引かない", () => {
    expect(buildSegments({ loop: false, stations: [{ id: "a", x: 0, y: 0 }] })).toEqual([]);
  });

  it("実データでも線分の key が重複しない（React の key に使うため）", () => {
    for (const name of LINE_ORDER) {
      const keys = buildSegments(LINES[name]).map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("labelAttrs", () => {
  const station = { x: 100, y: 100 };

  it("left は丸の左側に、右揃えで置く", () => {
    expect(labelAttrs({ ...station, label: "left" })).toEqual({
      x: 100 - R - 12,
      y: 105,
      textAnchor: "end",
    });
  });

  it("right は丸の右側に、左揃えで置く", () => {
    expect(labelAttrs({ ...station, label: "right" })).toEqual({
      x: 100 + R + 12,
      y: 105,
      textAnchor: "start",
    });
  });

  it("top / bottom は中央揃えで、丸に重ならない位置に置く", () => {
    const top = labelAttrs({ ...station, label: "top" });
    const bottom = labelAttrs({ ...station, label: "bottom" });

    expect(top.textAnchor).toBe("middle");
    expect(bottom.textAnchor).toBe("middle");
    expect(top.y).toBeLessThan(station.y - R);
    expect(bottom.y).toBeGreaterThan(station.y + R);
  });

  it("label の指定がなければ top として扱う", () => {
    expect(labelAttrs(station)).toEqual(labelAttrs({ ...station, label: "top" }));
  });
});
