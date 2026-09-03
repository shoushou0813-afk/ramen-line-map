import { describe, it, expect } from "vitest";
import { LINES, LINE_ORDER, stationName } from "./lines";

// 駅の座標は手打ちなので、打ち間違いを機械的に見つけられるようにしておく。
// 路線を足した時にここが落ちれば、画面を開く前に気づける。

describe("LINE_ORDER", () => {
  it("LINES に定義された路線と過不足なく一致する", () => {
    expect([...LINE_ORDER].sort()).toEqual(Object.keys(LINES).sort());
  });

  it("各路線の id はキーと一致する", () => {
    for (const key of LINE_ORDER) {
      expect(LINES[key].id).toBe(key);
    }
  });
});

describe("駅データ", () => {
  it("同じ id の駅は路線をまたいでも同じ駅名になっている", () => {
    // id を共有することで投稿件数を路線間で共有しているので、
    // 名前がずれていると別の駅を同一視していることになる
    const names = new Map();
    for (const key of LINE_ORDER) {
      for (const st of LINES[key].stations) {
        if (names.has(st.id)) {
          expect(`${st.id}:${st.name}`).toBe(`${st.id}:${names.get(st.id)}`);
        } else {
          names.set(st.id, st.name);
        }
      }
    }
  });

  it("同じ路線内に同じ id の駅が二度出てこない", () => {
    for (const key of LINE_ORDER) {
      const ids = LINES[key].stations.map((st) => st.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("同じ路線内で駅の座標が重なっていない", () => {
    for (const key of LINE_ORDER) {
      const points = LINES[key].stations.map((st) => `${st.x},${st.y}`);
      expect(new Set(points).size).toBe(points.length);
    }
  });

  it("駅が viewBox の内側に収まっている", () => {
    for (const key of LINE_ORDER) {
      const [, , width, height] = LINES[key].viewBox.split(" ").map(Number);
      for (const st of LINES[key].stations) {
        expect(st.x).toBeGreaterThanOrEqual(0);
        expect(st.y).toBeGreaterThanOrEqual(0);
        expect(st.x).toBeLessThanOrEqual(width);
        expect(st.y).toBeLessThanOrEqual(height);
      }
    }
  });

  it("label は上下左右のいずれかになっている", () => {
    for (const key of LINE_ORDER) {
      for (const st of LINES[key].stations) {
        expect(["top", "bottom", "left", "right"]).toContain(st.label);
      }
    }
  });
});

describe("stationName", () => {
  it("id から駅名を引ける", () => {
    expect(stationName("shinjuku")).toBe("新宿");
  });

  it("知らない id はそのまま返す", () => {
    expect(stationName("unknown-station")).toBe("unknown-station");
  });
});
