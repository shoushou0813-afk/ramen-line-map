// CSVの読み込み。
//
// 「カンマで区切る」だけに見えて、値の中にカンマや改行が入ると
// ダブルクォートで囲まれる決まりがあるため、split(",") では壊れる。
// 使うのはこの1機能だけなのでライブラリは足さず、1文字ずつ読む方式で書いた。

/**
 * CSVの文字列を、行×列の二次元配列にする。
 *
 * 決まりごと:
 * - 値が " で囲まれている間は、カンマも改行もただの文字として扱う
 * - 囲みの中の "" は、1つの " を表す
 * - 改行は \n でも \r\n でもよい
 */
export function parseCsv(text) {
  // BOM（ファイル先頭に付く見えない印）が残っていると、最初の見出しに混ざる
  const input = String(text).replace(/^﻿/, "");

  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const c = input[i];

    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1; // 2文字で1つの " なので、次の1文字は読み飛ばす
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }

  // 最後の行が改行で終わっていない場合の取りこぼしを拾う
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // 末尾の空行を落とす
  while (rows.length > 0 && rows[rows.length - 1].every((v) => v.trim() === "")) rows.pop();

  return rows;
}

/**
 * 読み込んだファイルの中身を文字列にする。
 *
 * エクセルの「CSVとして保存」は、日本語環境だと今もShift_JISで書き出される。
 * これをUTF-8として読むと全部文字化けするので、まずUTF-8として厳密に読んでみて、
 * 失敗したらShift_JISとして読み直す。
 * （fatal: true にすると、UTF-8として不正なときに例外を投げてくれる）
 */
export function decodeSheetText(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("shift_jis").decode(buffer);
  }
}
