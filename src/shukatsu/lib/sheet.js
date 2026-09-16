// エクセル／CSVの表を読んで、このアプリの予定に変換する。
//
// 就活の管理表は人によって書き方がバラバラなので、決まった様式を強制せず、
// 見出しの言葉から「どの列が何か」を推測する方式にしている。
// ここは画面を持たない純粋な計算だけなので、テストで確かめられる。

import { toDateKey, toTimeLabel } from "./date.js";

// ---------------------------------------------------------------------------
// 見出しの正規化
// ---------------------------------------------------------------------------

/**
 * 見出しの表記ゆれを吸収する。
 * - 前後の空白と、途中の空白（半角・全角）を消す
 * - 全角の英数字を半角にする（Ｅ Ｓ → es）。全角英数はUnicode上で
 *   半角のちょうど0xFEE0だけ後ろにあるので、その分を引けば半角になる
 * - 英字は小文字に揃える
 */
export function normalizeHeader(text) {
  if (text == null) return "";
  return String(text)
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[\s　]/g, "")
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// 種別の推測
// ---------------------------------------------------------------------------

// 上から順に見て、最初に当てはまったものを採る。
// 「Webテスト」は「テスト」を含むので、面接や説明会より先に置いている。
const TYPE_RULES = [
  ["es", ["エントリーシート", "es", "履歴書", "提出書類"]],
  ["webtest", ["webテスト", "テスト", "spi", "玉手箱", "tg-web", "適性検査", "筆記"]],
  ["og", ["ob", "og", "訪問", "リクルーター"]],
  ["briefing", ["説明会", "セミナー", "仕事研究", "座談会", "インターン", "ｉｎｔｅｒｎ"]],
  ["interview", ["面接", "面談", "選考", "グループディスカッション", "グルディス", "gd"]],
];

/**
 * 「一次面接」「会社説明会」「SPI」などの文字から種別を当てる。
 * 分からなければ "other"。
 */
export function detectType(text) {
  const t = normalizeHeader(text);
  if (!t) return "other";
  for (const [type, words] of TYPE_RULES) {
    for (const word of words) {
      // ob / og / es / gd は英字なので、単語の切れ目で区切って誤爆を防ぐ
      if (/^[a-z]+$/.test(word)) {
        if (new RegExp(`(^|[^a-z])${word}([^a-z]|$)`).test(t)) return type;
      } else if (t.includes(word)) {
        return type;
      }
    }
  }
  return "other";
}

// ---------------------------------------------------------------------------
// 列の推測
// ---------------------------------------------------------------------------

// 上にある項目から順に判定する。「提出日」は日付、「提出済」は完了、のように
// 似た言葉があるので、長くて具体的な語を先に置いている。
const COLUMN_RULES = [
  ["company", ["企業名", "会社名", "団体名", "企業", "会社", "社名", "company"]],
  ["done", ["提出済", "参加済", "完了", "ステータス", "状況", "status"]],
  ["date", ["開催日", "実施日", "予定日", "提出日", "締切", "〆切", "締め切り", "期限",
            "日付", "日程", "日時", "date", "deadline"]],
  ["end", ["終了時刻", "終了時間", "終了", "end"]],
  ["start", ["開始時刻", "開始時間", "開始", "時刻", "時間", "start", "time"]],
  ["type", ["種別", "区分", "種類", "イベント", "カテゴリ", "内容"]],
  ["place", ["場所", "会場", "開催地", "住所", "形式", "url", "リンク", "link", "place"]],
  ["memo", ["備考", "メモ", "補足", "コメント", "持ち物", "note", "memo"]],
];

/**
 * 見出しの行から「どの列が何か」を決める。
 * 同じ項目に当てはまる列が複数あったら、左にある方を採る。
 *
 * @param {any[]} headerRow 見出しの行
 * @param {Set<number>} skip 無視する列（横持ちの種別列など）
 * @returns {{[field: string]: number}}
 */
export function detectColumns(headerRow, skip = new Set()) {
  const columns = {};
  headerRow.forEach((raw, index) => {
    if (skip.has(index)) return;
    const text = normalizeHeader(raw);
    if (!text) return;
    for (const [field, words] of COLUMN_RULES) {
      if (columns[field] != null) continue;
      if (words.some((w) => text.includes(w))) {
        columns[field] = index;
        return;
      }
    }
  });
  return columns;
}

/**
 * 「1社1行、列が選考フェーズ」の表で、種別そのものが見出しになっている列を探す。
 * 例: 企業名 | 説明会 | ES締切 | Webテスト | 一次面接
 *
 * @returns {{index: number, type: string, label: string}[]}
 */
export function detectTypeColumns(headerRow) {
  const found = [];
  headerRow.forEach((raw, index) => {
    const label = raw == null ? "" : String(raw).trim();
    if (!label) return;
    // 「企業名」「備考」のような一般の項目は種別列にしない
    const normalized = normalizeHeader(label);
    const isField = COLUMN_RULES.some(
      ([field, words]) => field !== "date" && words.some((w) => normalized.includes(w))
    );
    if (isField) return;

    const type = detectType(label);
    if (type !== "other") found.push({ index, type, label });
  });
  return found;
}

/**
 * 見出しの行が何行目かを探す。
 * 表の上にタイトルや空行が入っていることが多いので、先頭から10行を見て
 * 「項目として認識できた数」が一番多い行を見出しとみなす。
 */
export function findHeaderRow(rows) {
  let best = -1;
  let bestScore = 0;
  const limit = Math.min(rows.length, 10);

  for (let i = 0; i < limit; i += 1) {
    const row = rows[i] ?? [];
    const typeColumns = detectTypeColumns(row);
    const skip = new Set(typeColumns.map((c) => c.index));
    const columns = detectColumns(row, skip);
    const score = Object.keys(columns).length + typeColumns.length;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return bestScore >= 2 ? best : -1;
}

/**
 * 表全体を見て、見出しの位置・表の形・列の対応をまとめる。
 *
 * layout は2種類:
 *   "long" … 1行が1予定（企業名 / 種別 / 日付 / …）
 *   "wide" … 1行が1社で、列が選考フェーズ（企業名 / 説明会 / ES締切 / …）
 */
export function analyzeSheet(rows) {
  const headerIndex = findHeaderRow(rows);
  if (headerIndex < 0) {
    throw new Error("見出しの行が見つかりませんでした。1行目に「企業名」「日付」などの項目名がある表にしてください");
  }

  const header = rows[headerIndex];
  const typeColumns = detectTypeColumns(header);
  const skip = new Set(typeColumns.map((c) => c.index));
  const columns = detectColumns(header, skip);

  if (columns.company == null) {
    throw new Error("企業名の列が見つかりませんでした。見出しに「企業名」や「会社名」を入れてください");
  }

  const layout = typeColumns.length >= 2 ? "wide" : "long";
  if (layout === "long" && columns.date == null) {
    throw new Error("日付の列が見つかりませんでした。見出しに「日付」「開催日」「締切」などを入れてください");
  }

  return { headerIndex, header, layout, columns, typeColumns };
}

// ---------------------------------------------------------------------------
// 日付と時刻
// ---------------------------------------------------------------------------

// Excelは日付を「1900年1月1日からの日数」で持つが、実在しない1900年2月29日を
// 1日として数える昔からの仕様がある。起点を1899年12月30日にすると帳尻が合う。
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

function isTimeOnly(date) {
  // 時刻だけのセルは 1899-12-30 を土台にした値として渡ってくる
  return date.getUTCFullYear() < 1900;
}

function keyFromUtc(date) {
  return toDateKey(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * 年が書かれていない「9/18」のような日付から年を決める。
 * 就活の表は年度をまたぐので、そのままだと3月の予定が過去になってしまう。
 * 今年として読んで3か月以上前になるなら、来年のこととみなす。
 */
export function inferYear(month, day, today) {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const candidate = new Date(today.getFullYear(), month - 1, day);
  const diffDays = (candidate - base) / 86400000;
  return diffDays < -90 ? today.getFullYear() + 1 : today.getFullYear();
}

function buildKey(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  // 2月30日のような日付は、作ると3月に繰り上がる。月が変わっていたら不正とみなす
  if (d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return toDateKey(d);
}

/**
 * セルの値から日付（"YYYY-MM-DD"）を取り出す。読めなければ null。
 * Date / Excelのシリアル値 / 文字列（2026/9/18、9月18日、9/18 …）に対応する。
 */
export function parseSheetDate(value, today = new Date()) {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime()) || isTimeOnly(value)) return null;
    // エクセルの日付はUTCの0時として渡ってくる。日本時間として読むと
    // 9時間ずれて前日になることがあるので、UTC側の年月日をそのまま使う
    return keyFromUtc(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 1 || value > 100000) return null;
    return keyFromUtc(new Date(EXCEL_EPOCH_UTC + Math.floor(value) * 86400000));
  }

  const text = String(value).trim();
  if (!text) return null;

  // 2026/9/18、2026-09-18、2026年9月18日
  const full = /(\d{4})\s*[-/年.]\s*(\d{1,2})\s*[-/月.]\s*(\d{1,2})/.exec(text);
  if (full) return buildKey(Number(full[1]), Number(full[2]), Number(full[3]));

  // 9/18、9月18日、9-18
  const md = /(?:^|[^\d])(\d{1,2})\s*[-/月]\s*(\d{1,2})\s*日?/.exec(" " + text);
  if (md) {
    const month = Number(md[1]);
    const day = Number(md[2]);
    if (month < 1 || month > 12) return null;
    return buildKey(inferYear(month, day, today), month, day);
  }

  return null;
}

// 「13:00〜14:30」の区切りに使われる記号。全角チルダや長音記号も就活の表では普通に出てくる
const TIME_PATTERN = /(\d{1,2})\s*(?::|：|時)\s*(\d{1,2})?\s*分?/g;

/**
 * セルの値から開始・終了の時刻を取り出す。
 * 見つからなければ { start: "", end: "" }。
 */
export function parseSheetTime(value) {
  const empty = { start: "", end: "" };
  if (value == null || value === "") return empty;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return empty;
    const minutes = value.getUTCHours() * 60 + value.getUTCMinutes();
    // 日付だけのセル（0時ちょうど）は「時刻なし」とみなす
    if (!isTimeOnly(value) && minutes === 0) return empty;
    return { start: toTimeLabel(minutes), end: "" };
  }

  if (typeof value === "number") {
    // 1未満の小数は「1日のうちの割合」。0.5 なら12:00
    if (value <= 0 || value >= 1) return empty;
    return { start: toTimeLabel(Math.round(value * 24 * 60)), end: "" };
  }

  const text = String(value);
  const found = [];
  TIME_PATTERN.lastIndex = 0; // g付きの正規表現は前回の位置を覚えているので戻す
  let m;
  while ((m = TIME_PATTERN.exec(text)) !== null) {
    const h = Number(m[1]);
    const min = Number(m[2] ?? 0);
    if (h > 23 || min > 59) continue;
    found.push(toTimeLabel(h * 60 + min));
    if (found.length === 2) break;
  }

  return { start: found[0] ?? "", end: found[1] ?? "" };
}

// ---------------------------------------------------------------------------
// 表 → 予定
// ---------------------------------------------------------------------------

const cell = (row, index) => (index == null ? null : (row?.[index] ?? null));
const text = (value) => (value == null ? "" : String(value).trim());

function isDone(value) {
  const t = normalizeHeader(value);
  if (!t) return false;
  return ["済", "完了", "提出済", "参加済", "done", "ok", "○", "◯", "o", "×"].some(
    (w) => t.includes(w) && w !== "×"
  );
}

/**
 * 表を予定の配列に変換する。
 *
 * @returns {{events: object[], skipped: {row: number, reason: string}[]}}
 *   events には id を入れていない。呼び出し側で採番する
 */
export function sheetToEvents(rows, analysis, today = new Date()) {
  const { headerIndex, layout, columns, typeColumns } = analysis;
  const events = [];
  const skipped = [];

  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const rowNumber = i + 1; // 画面には1始まりの行番号で見せる
    const company = text(cell(row, columns.company));

    // 完全に空の行は、区切りとして入っているだけなので黙って飛ばす
    const hasAnything = row.some((c) => text(c) !== "");
    if (!hasAnything) continue;

    if (!company) {
      skipped.push({ row: rowNumber, reason: "企業名が空でした" });
      continue;
    }

    const place = text(cell(row, columns.place));
    const memo = text(cell(row, columns.memo));
    const done = isDone(cell(row, columns.done));

    if (layout === "wide") {
      let madeAny = false;
      for (const col of typeColumns) {
        const value = cell(row, col.index);
        if (text(value) === "") continue;
        const date = parseSheetDate(value, today);
        if (!date) {
          skipped.push({ row: rowNumber, reason: `「${col.label}」の日付を読めませんでした（${text(value)}）` });
          continue;
        }
        const time = parseSheetTime(value);
        events.push({
          company,
          type: col.type,
          date,
          start: time.start,
          end: time.end,
          place,
          // 「一次面接」「最終面接」のように同じ種別が並ぶので、列の名前を残しておく
          memo: [col.label, memo].filter(Boolean).join(" / "),
          done,
        });
        madeAny = true;
      }
      if (!madeAny) {
        skipped.push({ row: rowNumber, reason: `「${company}」に日付が1つも入っていませんでした` });
      }
      continue;
    }

    const dateValue = cell(row, columns.date);
    const date = parseSheetDate(dateValue, today);
    if (!date) {
      skipped.push({
        row: rowNumber,
        reason: text(dateValue)
          ? `日付を読めませんでした（${text(dateValue)}）`
          : "日付が空でした",
      });
      continue;
    }

    // 時刻は専用の列を優先し、無ければ日付の欄（「9/17 18:30」など）から拾う
    const fromColumn = parseSheetTime(cell(row, columns.start));
    const time = fromColumn.start ? fromColumn : parseSheetTime(dateValue);
    const endFromColumn = parseSheetTime(cell(row, columns.end)).start;

    events.push({
      company,
      type: detectType(cell(row, columns.type)),
      date,
      start: time.start,
      end: endFromColumn || time.end,
      place,
      memo,
      done,
    });
  }

  return { events, skipped };
}

/**
 * すでにある予定と突き合わせて、重なるものを外す。
 * 同じ表を2回取り込んでも増えないようにするため。
 * 「同じ企業・同じ日・同じ種別」なら同じ予定とみなす。
 */
export function mergeEvents(existing, incoming) {
  const keyOf = (e) => `${e.company}|${e.date}|${e.type}`;
  const seen = new Set(existing.map(keyOf));

  const added = [];
  let duplicates = 0;
  for (const e of incoming) {
    const key = keyOf(e);
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    added.push(e);
  }

  return { merged: [...existing, ...added], added, duplicates };
}
