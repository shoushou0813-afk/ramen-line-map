import { describe, it, expect } from "vitest";
import {
  analyzeSheet,
  detectColumns,
  detectType,
  detectTypeColumns,
  findHeaderRow,
  inferYear,
  mergeEvents,
  normalizeHeader,
  parseSheetDate,
  parseSheetTime,
  sheetToEvents,
} from "./sheet.js";

const TODAY = new Date(2026, 8, 16); // 2026-09-16（水）

// エクセルの日付セルは「UTCの0時のDate」として渡ってくる
const xlsxDate = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
// 時刻だけのセルは 1899-12-30 を土台にした Date になる
const xlsxTime = (h, min) => new Date(Date.UTC(1899, 11, 30, h, min));

describe("normalizeHeader", () => {
  it("空白を消し、全角英数を半角にして小文字に揃える", () => {
    expect(normalizeHeader(" 企 業 名 ")).toBe("企業名");
    expect(normalizeHeader("ＥＳ締切")).toBe("es締切");
    expect(normalizeHeader("Web　テスト")).toBe("webテスト");
    expect(normalizeHeader(null)).toBe("");
  });
});

describe("detectType", () => {
  it("よくある言い回しから種別を当てる", () => {
    expect(detectType("会社説明会")).toBe("briefing");
    expect(detectType("ES締切")).toBe("es");
    expect(detectType("エントリーシート提出")).toBe("es");
    expect(detectType("一次面接")).toBe("interview");
    expect(detectType("最終選考")).toBe("interview");
    expect(detectType("グループディスカッション")).toBe("interview");
    expect(detectType("SPI")).toBe("webtest");
    expect(detectType("Webテスト")).toBe("webtest");
    expect(detectType("OB訪問")).toBe("og");
    expect(detectType("")).toBe("other");
    expect(detectType("懇親会")).toBe("other");
  });

  it("Webテストを面接や説明会に取られない", () => {
    // 「テスト」は他の語より先に判定している
    expect(detectType("適性検査（テストセンター）")).toBe("webtest");
  });

  it("英字の種別は単語として見る（誤爆しない）", () => {
    expect(detectType("job")).toBe("other"); // ob を含むが単語ではない
    expect(detectType("logistics")).toBe("other"); // og を含むが単語ではない
    expect(detectType("OB・OG訪問")).toBe("og");
  });

  it("英字表記のインターンも説明会として扱う", () => {
    // 判定は半角に揃えたあとの文字列に対して行う
    expect(detectType("Intern")).toBe("briefing");
    expect(detectType("ＩＮＴＥＲＮ")).toBe("briefing");
    expect(detectType("インターン")).toBe("briefing");
  });
});

describe("detectColumns", () => {
  it("見出しから列を割り当てる", () => {
    const columns = detectColumns(["企業名", "種別", "開催日", "時間", "会場", "備考"]);
    expect(columns).toEqual({ company: 0, type: 1, date: 2, start: 3, place: 4, memo: 5 });
  });

  it("「提出日」は日付、「提出済」は完了として分ける", () => {
    const columns = detectColumns(["会社名", "提出日", "提出済"]);
    expect(columns).toEqual({ company: 0, date: 1, done: 2 });
  });

  it("開始と終了を取り違えない", () => {
    const columns = detectColumns(["企業", "日付", "開始時刻", "終了時刻"]);
    expect(columns.start).toBe(2);
    expect(columns.end).toBe(3);
  });

  it("同じ項目が複数あれば左を採る", () => {
    const columns = detectColumns(["企業名", "備考", "メモ"]);
    expect(columns.memo).toBe(1);
  });
});

describe("detectTypeColumns", () => {
  it("列の見出しが種別そのものの場合に拾う", () => {
    const found = detectTypeColumns(["企業名", "説明会", "ES締切", "一次面接", "メモ"]);
    expect(found.map((c) => [c.index, c.type])).toEqual([
      [1, "briefing"],
      [2, "es"],
      [3, "interview"],
    ]);
  });

  it("「企業名」「備考」のような一般の項目は種別列にしない", () => {
    expect(detectTypeColumns(["企業名", "種別", "日付", "備考"])).toEqual([]);
  });

  it("項目名と種別の両方に当てはまる見出しは、当たった語が長い方を採る", () => {
    // 「会社説明会」は「会社」（項目名）と「説明会」（種別）の両方を含む。
    // 項目名に取られると、この列の日付が黙って捨てられてしまう
    const found = detectTypeColumns(["企業名", "会社説明会", "ES締切"]);
    expect(found.map((c) => [c.index, c.type])).toEqual([
      [1, "briefing"],
      [2, "es"],
    ]);
  });

  it("引き分けのときは項目名を優先する", () => {
    // 「選考状況」は「選考」（面接）と「状況」（完了）がどちらも2文字。
    // 状況の列を面接の列にしてしまわない
    expect(detectTypeColumns(["企業名", "選考状況"])).toEqual([]);
  });
});

describe("findHeaderRow / analyzeSheet", () => {
  it("表の上にタイトルや空行があっても見出しを見つける", () => {
    const rows = [
      ["2027卒 就活管理表"],
      [],
      ["企業名", "種別", "開催日", "時間"],
      ["サンプル商事", "説明会", xlsxDate(2026, 9, 15), "13:00"],
    ];
    expect(findHeaderRow(rows)).toBe(2);
    expect(analyzeSheet(rows).layout).toBe("long");
  });

  it("種別が列になっていれば横持ちと判定する", () => {
    const rows = [["企業名", "説明会", "ES締切", "一次面接"], ["ヨコ商事", "9/15", "9/18", ""]];
    const analysis = analyzeSheet(rows);
    expect(analysis.layout).toBe("wide");
    expect(analysis.typeColumns).toHaveLength(3);
  });

  it("種別の列が1つでも、ほかに日付の列が無ければ横持ちとして読む", () => {
    // 「企業名 | 面接日 | 場所」のような、1つの選考だけを管理している表
    for (const header of [
      ["企業名", "面接日", "場所"],
      ["企業名", "ES締切", "提出済"],
    ]) {
      const analysis = analyzeSheet([header, ["A社", "9/18", ""]]);
      expect(analysis.layout).toBe("wide");
      expect(analysis.typeColumns).toHaveLength(1);
    }
  });

  it("日付の列があれば、種別らしい列が1つあっても縦持ちのまま", () => {
    const analysis = analyzeSheet([
      ["企業名", "種別", "開催日", "面接官"],
      ["A社", "説明会", "9/18", "山田"],
    ]);
    expect(analysis.layout).toBe("long");
  });

  it("企業名の列が無ければエラーにする", () => {
    expect(() => analyzeSheet([["日付", "種別"], ["9/15", "説明会"]])).toThrow(/企業名/);
  });

  it("縦持ちで日付の列が無ければエラーにする", () => {
    expect(() => analyzeSheet([["企業名", "種別", "備考"], ["A社", "説明会", ""]])).toThrow(/日付/);
  });

  it("見出しらしい行が無ければエラーにする", () => {
    expect(() => analyzeSheet([["あ"], ["い"]])).toThrow(/見出し/);
  });
});

describe("parseSheetDate", () => {
  it("エクセルの日付セル（UTCの0時）を日付ずれなく読む", () => {
    // 日本時間として読むと9時間ずれて前日になる値
    expect(parseSheetDate(xlsxDate(2026, 9, 15), TODAY)).toBe("2026-09-15");
    expect(parseSheetDate(xlsxDate(2027, 1, 1), TODAY)).toBe("2027-01-01");
  });

  it("シリアル値（数値）を読む", () => {
    // 45915 = 2025-09-15。1900年2月29日の分のずれも吸収する
    expect(parseSheetDate(45915, TODAY)).toBe("2025-09-15");
    expect(parseSheetDate(1, TODAY)).toBe("1899-12-31");
  });

  it("いろいろな書き方の文字列を読む", () => {
    expect(parseSheetDate("2026/9/18", TODAY)).toBe("2026-09-18");
    expect(parseSheetDate("2026-09-18", TODAY)).toBe("2026-09-18");
    expect(parseSheetDate("2026年9月18日", TODAY)).toBe("2026-09-18");
    expect(parseSheetDate("9/18", TODAY)).toBe("2026-09-18");
    expect(parseSheetDate("9月18日", TODAY)).toBe("2026-09-18");
    expect(parseSheetDate("9/18(金) 13:00", TODAY)).toBe("2026-09-18");
  });

  it("年が無い場合、過ぎすぎていれば翌年とみなす", () => {
    // 9月時点の表に書かれた「3/15」は翌年3月のこと
    expect(parseSheetDate("3/15", TODAY)).toBe("2027-03-15");
    // 少し前の日付は今年のまま（書き漏らしの実績として残っていることがある）
    expect(parseSheetDate("9/1", TODAY)).toBe("2026-09-01");
  });

  it("読めない値は null", () => {
    expect(parseSheetDate("", TODAY)).toBeNull();
    expect(parseSheetDate(null, TODAY)).toBeNull();
    expect(parseSheetDate("未定", TODAY)).toBeNull();
    expect(parseSheetDate("13月40日", TODAY)).toBeNull();
    expect(parseSheetDate("2026/2/30", TODAY)).toBeNull();
    expect(parseSheetDate(xlsxTime(10, 0), TODAY)).toBeNull(); // 時刻だけのセル
  });
});

describe("parseSheetTime", () => {
  it("時刻だけのセルを読む", () => {
    expect(parseSheetTime(xlsxTime(10, 0))).toEqual({ start: "10:00", end: "" });
  });

  it("日付だけのセルからは時刻を取らない", () => {
    expect(parseSheetTime(xlsxDate(2026, 9, 15))).toEqual({ start: "", end: "" });
  });

  it("時間帯の書き方を一通り読む", () => {
    expect(parseSheetTime("13:00~14:30")).toEqual({ start: "13:00", end: "14:30" });
    expect(parseSheetTime("13:00-14:30")).toEqual({ start: "13:00", end: "14:30" });
    expect(parseSheetTime("18:30〜19:30")).toEqual({ start: "18:30", end: "19:30" });
    expect(parseSheetTime("13時30分から15時")).toEqual({ start: "13:30", end: "15:00" });
    expect(parseSheetTime("23:59")).toEqual({ start: "23:59", end: "" });
    expect(parseSheetTime("9/17 18:30")).toEqual({ start: "18:30", end: "" });
  });

  it("小数は1日のうちの割合として読む", () => {
    expect(parseSheetTime(0.5)).toEqual({ start: "12:00", end: "" });
  });

  it("時刻が無ければ空", () => {
    expect(parseSheetTime("")).toEqual({ start: "", end: "" });
    expect(parseSheetTime("未定")).toEqual({ start: "", end: "" });
    expect(parseSheetTime("9/23")).toEqual({ start: "", end: "" }); // 日付を時刻と読まない
    expect(parseSheetTime("25:00")).toEqual({ start: "", end: "" });
  });

  it("続けて呼んでも結果が変わらない（正規表現の位置が残らない）", () => {
    expect(parseSheetTime("13:00~14:30")).toEqual(parseSheetTime("13:00~14:30"));
  });
});

describe("sheetToEvents（縦持ち）", () => {
  const rows = [
    ["2027卒 就活管理表"],
    [],
    ["企業名", "種別", "開催日", "時間", "会場", "備考", "提出済"],
    ["サンプル商事", "説明会", xlsxDate(2026, 9, 15), "13:00~14:30", "オンライン", "事前アンケート", ""],
    ["サンプル商事", "ES締切", xlsxDate(2026, 9, 18), "23:59", "マイページ", "", ""],
    ["サンプルメーカー", "SPI", "9/23", "", "自宅受験", "", ""],
    ["サンプル銀行", "一次面接", "2026/9/24", xlsxTime(10, 0), "本社12F", "", ""],
    ["サンプル物産", "OB訪問", "9月17日", "18:30〜19:30", "駅前カフェ", "", "済"],
    ["", "", "", "", "", "", ""],
    ["日付なし社", "説明会", "", "", "", "", ""],
  ];
  const { events, skipped } = sheetToEvents(rows, analyzeSheet(rows), TODAY);

  it("1行が1予定になる", () => {
    expect(events).toHaveLength(5);
  });

  it("日付・時刻・種別・場所を読み取る", () => {
    expect(events[0]).toEqual({
      company: "サンプル商事",
      type: "briefing",
      date: "2026-09-15",
      start: "13:00",
      end: "14:30",
      place: "オンライン",
      memo: "事前アンケート",
      done: false,
    });
  });

  it("時刻セルが時刻型でも文字列でも読める", () => {
    expect(events.find((e) => e.company === "サンプル銀行")).toMatchObject({
      type: "interview",
      date: "2026-09-24",
      start: "10:00",
    });
  });

  it("済みの印を拾う", () => {
    expect(events.find((e) => e.company === "サンプル物産").done).toBe(true);
  });

  it("「未完了」「No」を完了と取り違えない", () => {
    // 部分一致で見ると「未完了」が「完了」を、「No」が「o」を含んでしまう
    const doneOf = (mark) => {
      const rows = [
        ["企業名", "日付", "提出済"],
        ["A社", "9/18", mark],
      ];
      return sheetToEvents(rows, analyzeSheet(rows), TODAY).events[0].done;
    };
    for (const mark of ["済", "済み", "完了", "提出済み", "○", "done", "OK"]) {
      expect(doneOf(mark), mark).toBe(true);
    }
    for (const mark of ["未完了", "未提出", "未参加", "No", "Not yet", "×", "なし", ""]) {
      expect(doneOf(mark), mark).toBe(false);
    }
  });

  it("空行は黙って飛ばし、日付が読めない行は理由を残す", () => {
    expect(skipped).toHaveLength(1);
    expect(skipped[0]).toMatchObject({ row: 10 });
    expect(skipped[0].reason).toMatch(/日付が空/);
  });
});

describe("sheetToEvents（横持ち）", () => {
  const rows = [
    ["企業名", "説明会", "ES締切", "Webテスト", "一次面接", "最終面接", "メモ"],
    ["ヨコ商事", xlsxDate(2026, 9, 15), xlsxDate(2026, 9, 18), "9/23", xlsxDate(2026, 10, 1), "", "第一志望"],
    ["ヨコ銀行", "9/17 18:30", "10/2", "", "", "", ""],
    ["ヨコ製作所", "", "", "", "", "", "まだ何も"],
  ];
  const { events, skipped } = sheetToEvents(rows, analyzeSheet(rows), TODAY);

  it("1社の行から、日付が入っている列の数だけ予定を作る", () => {
    expect(events.filter((e) => e.company === "ヨコ商事")).toHaveLength(4);
    expect(events.filter((e) => e.company === "ヨコ銀行")).toHaveLength(2);
  });

  it("列の見出しから種別を決める", () => {
    const yoko = events.filter((e) => e.company === "ヨコ商事");
    expect(yoko.map((e) => e.type)).toEqual(["briefing", "es", "webtest", "interview"]);
  });

  it("同じ日付のセルに時刻があれば拾う", () => {
    expect(events.find((e) => e.company === "ヨコ銀行" && e.type === "briefing")).toMatchObject({
      date: "2026-09-17",
      start: "18:30",
    });
  });

  it("「一次面接」「最終面接」を見分けられるよう列名をメモに残す", () => {
    const e = events.find((x) => x.company === "ヨコ商事" && x.type === "interview");
    expect(e.memo).toContain("一次面接");
    expect(e.memo).toContain("第一志望");
  });

  it("日付が1つも無い社は理由付きで飛ばす", () => {
    expect(skipped.some((s) => s.reason.includes("ヨコ製作所"))).toBe(true);
  });
});

describe("mergeEvents", () => {
  const e = (company, date, type) => ({ company, date, type });

  it("同じ企業・日付・種別なら二重に入れない", () => {
    const existing = [e("A社", "2026-09-15", "briefing")];
    const result = mergeEvents(existing, [
      e("A社", "2026-09-15", "briefing"),
      e("A社", "2026-09-18", "es"),
    ]);
    expect(result.added).toHaveLength(1);
    expect(result.duplicates).toBe(1);
    expect(result.merged).toHaveLength(2);
  });

  it("取り込むもの同士の重複も1つにまとめる", () => {
    const result = mergeEvents([], [e("A社", "2026-09-15", "es"), e("A社", "2026-09-15", "es")]);
    expect(result.added).toHaveLength(1);
    expect(result.duplicates).toBe(1);
  });

  it("元の配列を書き換えない", () => {
    const existing = [e("A社", "2026-09-15", "briefing")];
    mergeEvents(existing, [e("B社", "2026-09-16", "es")]);
    expect(existing).toHaveLength(1);
  });

  it("同じ日の一次面接と最終面接を1件に潰さない", () => {
    // どちらも種別は「面接」なので、企業名・日付・種別だけでは見分けられない
    const rows = [
      ["企業名", "一次面接", "最終面接"],
      ["A社", "9/18", "9/18"],
    ];
    const { events } = sheetToEvents(rows, analyzeSheet(rows), TODAY);
    expect(events).toHaveLength(2);

    const first = mergeEvents([], events);
    expect(first.added).toHaveLength(2);
    expect(first.duplicates).toBe(0);

    // 同じ表をもう一度入れても増えない
    const second = mergeEvents(first.merged, events);
    expect(second.added).toHaveLength(0);
    expect(second.duplicates).toBe(2);
  });

  it("同じ企業・同じ日・同じ種別でも、時刻が違えば別の予定として扱う", () => {
    const morning = { ...e("A社", "2026-09-18", "interview"), start: "10:00" };
    const afternoon = { ...e("A社", "2026-09-18", "interview"), start: "14:00" };
    expect(mergeEvents([morning], [afternoon]).added).toHaveLength(1);
  });
});

describe("inferYear", () => {
  it("3か月以上前になるなら翌年", () => {
    expect(inferYear(3, 15, TODAY)).toBe(2027);
    expect(inferYear(9, 1, TODAY)).toBe(2026);
    expect(inferYear(12, 1, TODAY)).toBe(2026);
  });
});
