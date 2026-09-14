import { describe, it, expect } from "vitest";
import { LINES, LINE_ORDER, stationName } from "./lines.js";

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
});
