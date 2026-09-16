import { describe, it, expect } from "vitest";
import { backupFileName, buildBackup, parseBackup } from "./backup.js";

const ev = (over = {}) => ({
  id: "a",
  company: "サンプル商事",
  type: "es",
  date: "2026-09-18",
  start: "23:59",
  end: "",
  place: "",
  memo: "",
  done: false,
  ...over,
});

describe("buildBackup", () => {
  it("アプリ名・バージョン・予定を含むJSONになる", () => {
    const json = JSON.parse(buildBackup([ev()], new Date(2026, 8, 16)));
    expect(json.app).toBe("shukatsu-timetable");
    expect(json.version).toBe(1);
    expect(json.events).toHaveLength(1);
    expect(json.events[0].company).toBe("サンプル商事");
  });

  it("書き出したものをそのまま読み戻せる", () => {
    const events = [ev(), ev({ id: "b", company: "サンプル銀行", type: "interview" })];
    expect(parseBackup(buildBackup(events))).toEqual(events);
  });
});

describe("backupFileName", () => {
  it("日付入りのファイル名になる", () => {
    expect(backupFileName(new Date(2026, 8, 6))).toBe("shukatsu-timetable-2026-09-06.json");
  });

  it("ブラウザに無視されないよう半角英数字だけで作る", () => {
    // 日本語を含むとChromiumが指定を無視して「download」で保存してしまう
    expect(backupFileName(new Date(2026, 8, 6))).toMatch(/^[\w.-]+$/);
  });
});

describe("parseBackup", () => {
  it("予定の配列だけのファイルも読める", () => {
    expect(parseBackup(JSON.stringify([ev()]))).toHaveLength(1);
  });

  it("足りない項目は既定値で埋める", () => {
    const [e] = parseBackup(JSON.stringify([{ company: "A社", date: "2026-09-18" }]));
    expect(e).toMatchObject({ company: "A社", type: "other", start: "", done: false });
    expect(e.id).toBeTruthy();
  });

  it("日付が壊れている予定は落とす", () => {
    const events = parseBackup(
      JSON.stringify([ev(), { company: "B社", date: "2026/09/18" }, { company: "C社" }])
    );
    expect(events).toHaveLength(1);
  });

  it("JSONでなければ例外を投げる", () => {
    expect(() => parseBackup("これはJSONではない")).toThrow(/JSON/);
  });

  it("形が違うファイルなら例外を投げる", () => {
    expect(() => parseBackup(JSON.stringify({ hello: "world" }))).toThrow(/書き出したファイル/);
  });

  it("読み込める予定が1件も無ければ例外を投げる", () => {
    expect(() => parseBackup(JSON.stringify({ events: [{ company: "A社" }] }))).toThrow(/予定/);
  });
});
