import { describe, it, expect } from "vitest";
import { LINES } from "../data/lines";
import { NAME_PX, labelSide, mapUnit, paddedViewBox, stationRadius, topStations } from "./lineMap";

function sideOf(lineId, stationId) {
  const line = LINES[lineId];
  return labelSide(line, line.stations.findIndex((st) => st.id === stationId));
}

describe("mapUnit / paddedViewBox", () => {
  it("横 648 の路線図なら、スマホの 1px は viewBox の 2", () => {
    expect(mapUnit("0 0 648 300")).toBe(2);
  });

  it("余白の分だけ viewBox を上下左右に広げる", () => {
    expect(paddedViewBox("0 0 648 300")).toBe("-16 -16 680 332");
  });
});

describe("stationRadius", () => {
  it("記録がない駅は小さな点", () => {
    expect(stationRadius(0)).toBe(5);
  });

  it("件数が多いほど大きく、16 で頭打ち", () => {
    expect(stationRadius(1)).toBeLessThan(stationRadius(3));
    expect(stationRadius(100)).toBe(16);
  });

  it("選んでいる駅は、記録がなくても数字が入る大きさ", () => {
    expect(stationRadius(0, true)).toBe(stationRadius(1));
  });
});

describe("labelSide", () => {
  it("ふつうの駅は駅名を丸の上に置く", () => {
    expect(sideOf("sobu", "mitaka")).toBe("top");
    expect(sideOf("sobu", "shinjuku")).toBe("top");
  });

  it("線が上から下りてくる角の駅は下に置く", () => {
    expect(sideOf("sobu", "nakano")).toBe("bottom");
    expect(sideOf("sobu", "shinanomachi")).toBe("bottom");
    expect(sideOf("sobu", "akihabara")).toBe("bottom");
  });

  it("線が下へ曲がっていく角の駅は上のまま", () => {
    expect(sideOf("sobu", "koenji")).toBe("top");
    expect(sideOf("sobu", "sendagaya")).toBe("top");
  });

  it("上下に線が通っている駅は、図の外側の横に置く", () => {
    expect(sideOf("yamanote", "ikebukuro")).toBe("right");
    expect(sideOf("yamanote", "ebisu")).toBe("left");
  });

  it("どの路線でも、同じ側に駅名がある隣の駅と駅名が重ならない", () => {
    for (const line of Object.values(LINES)) {
      const unit = mapUnit(line.viewBox);
      line.stations.forEach((st, i) => {
        const next = line.stations[i + 1];
        if (!next || next.y !== st.y) return;
        const side = labelSide(line, i);
        if (side !== labelSide(line, i + 1) || (side !== "top" && side !== "bottom")) return;
        const gapPx = Math.abs(next.x - st.x) / unit;
        const halfWidthsPx = ((st.name.length + next.name.length) * NAME_PX) / 2;
        expect(gapPx, `${line.name}の${st.name}と${next.name}`).toBeGreaterThan(halfWidthsPx);
      });
    }
  });
});

describe("topStations", () => {
  const line = LINES.sobu;

  it("記録がある駅だけを多い順に返し、同じ件数なら路線の順に並べる", () => {
    const counts = { iidabashi: 3, shinjuku: 6, nakano: 3, chiba: 0 };
    expect(topStations(line, counts).map((st) => [st.id, st.count])).toEqual([
      ["shinjuku", 6],
      ["nakano", 3],
      ["iidabashi", 3],
    ]);
  });

  it("limit 件までに絞る", () => {
    const counts = { mitaka: 1, kichijoji: 2, ogikubo: 3 };
    expect(topStations(line, counts, 2).map((st) => st.id)).toEqual(["ogikubo", "kichijoji"]);
  });

  it("記録がない路線なら空の配列", () => {
    expect(topStations(line, {})).toEqual([]);
  });
});
