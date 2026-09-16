// 予定の書き出し／読み込み。
//
// このアプリの予定はブラウザの中（localStorage）にしか無い。
// iOSではしばらく使わないとブラウザの保存領域が整理されて消えることがあり、
// 機種変更でも引き継げない。就活の締切が消えると実害が大きいので、
// ファイルに出して持ち出せるようにしてある。

/** 書き出すファイルの中身を作る。version を入れておくと、後で形を変えたときに見分けられる */
export function buildBackup(events, now = new Date()) {
  return JSON.stringify(
    {
      app: "shukatsu-timetable",
      version: 1,
      exportedAt: now.toISOString(),
      events,
    },
    null,
    2
  );
}

/**
 * 書き出すファイル名。例: shukatsu-timetable-2026-09-16.json
 *
 * 日本語を含む名前にすると、ブラウザによっては指定が無視されて
 * 「download」という名前で保存されてしまう（Chromiumで確認）。
 * 日付が分かれば十分なので、半角英数字だけで組み立てている。
 */
export function backupFileName(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `shukatsu-timetable-${y}-${m}-${d}.json`;
}

/**
 * 読み込んだ文字列を予定の配列に戻す。
 * 別のファイルを間違って選んだときに黙って全消ししないよう、
 * 形が違えば例外（Error）を投げて呼び出し元に知らせる。
 */
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("JSONとして読めませんでした");
  }

  // 書き出したファイルそのもの / 予定の配列だけ、のどちらでも受け取る
  const events = Array.isArray(data) ? data : data?.events;
  if (!Array.isArray(events)) {
    throw new Error("このアプリで書き出したファイルではないようです");
  }

  const valid = events.filter(
    (e) =>
      e &&
      typeof e === "object" &&
      typeof e.company === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(e.date ?? "")
  );
  if (valid.length === 0) {
    throw new Error("読み込める予定がありませんでした");
  }

  // 足りない項目を既定値で埋めてから返す（古い形のファイルでも開けるように）
  return valid.map((e) => ({
    id: typeof e.id === "string" && e.id ? e.id : `imported-${Math.random().toString(16).slice(2)}`,
    company: e.company,
    type: typeof e.type === "string" ? e.type : "other",
    date: e.date,
    start: typeof e.start === "string" ? e.start : "",
    end: typeof e.end === "string" ? e.end : "",
    place: typeof e.place === "string" ? e.place : "",
    memo: typeof e.memo === "string" ? e.memo : "",
    done: e.done === true,
  }));
}
