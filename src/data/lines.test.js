import { describe, it, expect } from "vitest";
import { LINES, LINE_ORDER, stationName, stationIdsMatching, genresMatching, linesOfStation } from "./lines.js";

describe("lines.js", () => {
  it("LINE_ORDERの路線がすべてLINESに存在する", () => {
    for (const id of LINE_ORDER) {
      expect(LINES[id]).toBeDefined();
    }
  });

  it("同じ駅IDなら駅名も同じ", () => {
    const names = {};
    for (const line of Object.values(LINES)) {
      for (const st of line.stations) {
        if (names[st.id]) {
          expect(st.name).toBe(names[st.id]);
        } else {
          names[st.id] = st.name;
        }
      }
    }
  });

  it("labelがtop/bottom/left/rightのいずれか", () => {
    const validLabels = ["top", "bottom", "left", "right"];
    for (const line of Object.values(LINES)) {
      for (const st of line.stations) {
        expect(validLabels).toContain(st.label);
      }
    }
  });

  it("京浜東北線と東海道線には、山手線の駅を入れない（山手線のタブに任せる）", () => {
    const yamanoteIds = LINES.yamanote.stations.map((st) => st.id);
    for (const key of ["keihintohoku", "tokaido"]) {
      for (const st of LINES[key].stations) {
        expect(yamanoteIds).not.toContain(st.id);
      }
    }
  });

  it("京浜東北線には、東海道線の駅を入れない（東海道線のタブに任せる）", () => {
    const tokaidoIds = LINES.tokaido.stations.map((st) => st.id);
    for (const st of LINES.keihintohoku.stations) {
      expect(tokaidoIds).not.toContain(st.id);
    }
  });

  it("京浜東北線に蒲田がある", () => {
    expect(LINES.keihintohoku.stations.map((st) => st.id)).toContain("kamata");
  });

  it("stationNameは既存IDなら駅名を返し、未知のIDならそのまま返す", () => {
    expect(stationName("shibuya")).toBe("渋谷");
    expect(stationName("mitaka")).toBe("三鷹");
    expect(stationName("nonexistent")).toBe("nonexistent");
  });
});

describe("linesOfStation", () => {
  it("その駅が出てくる路線を、タブの順番で返す", () => {
    expect(linesOfStation("shibuya")).toEqual(["yamanote", "denentoshi", "toyoko"]);
    expect(linesOfStation("kamata")).toEqual(["keihintohoku"]);
  });

  it("どの路線にもない駅なら空の配列", () => {
    expect(linesOfStation("sapporo")).toEqual([]);
  });
});

describe("stationIdsMatching", () => {
  it("駅名に含まれる文字で駅を探す", () => {
    expect(stationIdsMatching("渋谷")).toEqual(["shibuya"]);
  });

  it("最後に「駅」が付いていても探せる", () => {
    expect(stationIdsMatching("渋谷駅")).toEqual(["shibuya"]);
  });

  it("空欄や、どの駅にも当たらない文字なら空の配列を返す", () => {
    expect(stationIdsMatching("  ")).toEqual([]);
    expect(stationIdsMatching("札幌")).toEqual([]);
  });
});

describe("genresMatching", () => {
  it("種類名の一部でも探せる", () => {
    expect(genresMatching("二郎")).toEqual(["二郎系"]);
  });

  it("「家系ラーメン」のように種類名を含む言い方でも探せる", () => {
    expect(genresMatching("家系ラーメン")).toEqual(["家系"]);
  });

  it("空欄や、どの種類にも当たらない文字なら空の配列を返す", () => {
    expect(genresMatching(" ")).toEqual([]);
    expect(genresMatching("一蘭")).toEqual([]);
  });
});
