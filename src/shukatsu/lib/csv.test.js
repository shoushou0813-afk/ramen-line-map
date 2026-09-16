import { describe, it, expect } from "vitest";
import { decodeSheetText, parseCsv } from "./csv.js";

describe("parseCsv", () => {
  it("ふつうの表を読む", () => {
    expect(parseCsv("企業名,種別,日付\nA社,説明会,9/15")).toEqual([
      ["企業名", "種別", "日付"],
      ["A社", "説明会", "9/15"],
    ]);
  });

  it("値の中のカンマは区切りにしない", () => {
    expect(parseCsv('A社,"本社ビル3F, 受付集合",9/15')).toEqual([
      ["A社", "本社ビル3F, 受付集合", "9/15"],
    ]);
  });

  it("値の中の改行を保つ", () => {
    expect(parseCsv('A社,"1行目\n2行目"')).toEqual([["A社", "1行目\n2行目"]]);
  });

  it("囲みの中の \"\" は1つの \" として読む", () => {
    expect(parseCsv('A社,"いわゆる""第一志望"""')).toEqual([["A社", 'いわゆる"第一志望"']]);
  });

  it("改行コードがCRLFでも読める", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("先頭のBOMを取り除く", () => {
    expect(parseCsv("﻿企業名,日付")[0][0]).toBe("企業名");
  });

  it("空の値と末尾の空行を扱う", () => {
    expect(parseCsv("a,,c\n\n\n")).toEqual([["a", "", "c"]]);
  });

  it("空文字なら空の配列", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("decodeSheetText", () => {
  it("UTF-8をそのまま読む", () => {
    expect(decodeSheetText(new TextEncoder().encode("企業名"))).toBe("企業名");
  });

  it("エクセルが書き出すShift_JISも読める", () => {
    // 「企業名」のShift_JIS表現。UTF-8として読むと文字化けする
    const sjis = new Uint8Array([0x8a, 0xe9, 0x8b, 0xc6, 0x96, 0xbc]);
    expect(decodeSheetText(sjis)).toBe("企業名");
  });
});
