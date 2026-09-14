import { describe, it, expect } from "vitest";
import { LINES, LINE_ORDER, stationName } from "./lines.js";

describe("lines.js", () => {
  it("LINE_ORDERの路線がすべてLINESに存在する", () => {
    for (const id of LINE_ORDER) {
      expect(LINES[id]).toBeDefined();
    }
  });
});
