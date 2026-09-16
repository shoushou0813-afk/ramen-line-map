import { useRef, useState } from "react";
import { analyzeSheet, mergeEvents, sheetToEvents } from "../lib/sheet";
import { decodeSheetText, parseCsv } from "../lib/csv";
import { newId } from "../lib/storage";
import { formatMDW, toTimeLabel, toMinutes } from "../lib/date";
import { typeOf } from "../data/eventTypes";

const FIELD_LABELS = {
  company: "企業名",
  type: "種別",
  date: "日付",
  start: "開始時刻",
  end: "終了時刻",
  place: "場所",
  memo: "メモ",
  done: "完了",
};

/**
 * エクセル／CSVの管理表を読み込んで予定にする。
 *
 * いきなり取り込まず、必ず「何をどう読んだか」を見せてから確定させる。
 * 表の書き方は人によって違うので、取り違えていたらここで気づけるようにしたい。
 */
export default function SheetImport({ events, onImport }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function readRows(file) {
    const isCsv = /\.csv$/i.test(file.name);
    if (isCsv) {
      return parseCsv(decodeSheetText(await file.arrayBuffer()));
    }

    // エクセルを読む部分だけ、必要になったときに読み込む（動的インポート）。
    // 最初から入れると、取り込みを使わない人にも数百KBを配ることになる
    const { default: readXlsxFile } = await import("read-excel-file/browser");
    const sheets = await readXlsxFile(file);
    // 版によって「行の配列」と「[{sheet, data}]」のどちらかが返る
    if (Array.isArray(sheets) && sheets[0] && !Array.isArray(sheets[0]) && sheets[0].data) {
      return sheets[0].data;
    }
    return sheets;
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルをもう一度選べるように戻す
    if (!file) return;

    setBusy(true);
    setError("");
    setResult("");
    setPreview(null);

    try {
      const rows = await readRows(file);
      if (rows.length === 0) throw new Error("中身が空のファイルでした");

      const analysis = analyzeSheet(rows);
      const { events: parsed, skipped } = sheetToEvents(rows, analysis);
      if (parsed.length === 0) {
        throw new Error("取り込める予定が1件もありませんでした");
      }

      // 取り込む前に、すでに登録済みのものが何件あるかまで出しておく
      const { added, duplicates } = mergeEvents(events, parsed);
      setPreview({ fileName: file.name, analysis, added, duplicates, skipped });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function confirmImport() {
    const withIds = preview.added.map((e) => ({ ...e, id: newId() }));
    onImport([...events, ...withIds]);
    setResult(
      `${withIds.length}件を追加しました` +
        (preview.duplicates > 0 ? `（登録済みの${preview.duplicates}件は飛ばしました）` : "")
    );
    setPreview(null);
  }

  const columnSummary = preview
    ? Object.entries(preview.analysis.columns).map(([field, index]) => ({
        field,
        label: FIELD_LABELS[field],
        header: String(preview.analysis.header[index] ?? "").trim(),
      }))
    : [];

  return (
    <div className="sheet-import">
      <div className="data-actions">
        <button className="button" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? "読み込み中…" : "エクセル / CSV を選ぶ"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={handleFile}
          hidden
        />
      </div>

      <p className="hint">
        説明会をまとめている表をそのまま選べば、企業名・日付・種別を見出しから読み取って予定にします。
        取り込む前に中身を確認できます。
      </p>

      {error && <p className="error">{error}</p>}
      {result && <p className="data-message">{result}</p>}

      {preview && (
        <div className="preview">
          <h3 className="preview-title">{preview.fileName} を読みました</h3>

          <p className="preview-line">
            {preview.analysis.layout === "wide"
              ? "1行が1社、列が選考フェーズになっている表として読みました。"
              : "1行が1予定になっている表として読みました。"}
            （{preview.analysis.headerIndex + 1}行目を見出しとして使用）
          </p>

          {preview.analysis.layout === "wide" ? (
            <ul className="preview-mapping">
              {preview.analysis.typeColumns.map((c) => (
                <li key={c.index}>
                  「{c.label}」→ {typeOf(c.type).label}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="preview-mapping">
              {columnSummary.map((c) => (
                <li key={c.field}>
                  {c.label} ←「{c.header}」
                </li>
              ))}
            </ul>
          )}

          <p className="preview-line">
            <b>{preview.added.length}件</b>を追加できます
            {preview.duplicates > 0 && `（登録済みの${preview.duplicates}件は飛ばします）`}
          </p>

          {preview.added.length > 0 && (
            <ul className="preview-list">
              {preview.added.slice(0, 8).map((e, i) => {
                const type = typeOf(e.type);
                const start = toMinutes(e.start);
                return (
                  <li key={i}>
                    <span className="preview-type" style={{ background: type.bg, color: type.color }}>
                      {type.label}
                    </span>
                    <span className="preview-company">{e.company}</span>
                    <span className="preview-when">
                      {formatMDW(e.date)}
                      {start != null && ` ${toTimeLabel(start)}`}
                    </span>
                  </li>
                );
              })}
              {preview.added.length > 8 && (
                <li className="preview-more">ほか{preview.added.length - 8}件</li>
              )}
            </ul>
          )}

          {preview.skipped.length > 0 && (
            <details className="preview-skipped">
              <summary>読み取れなかった行（{preview.skipped.length}件）</summary>
              <ul>
                {preview.skipped.slice(0, 10).map((s, i) => (
                  <li key={i}>
                    {s.row}行目：{s.reason}
                  </li>
                ))}
                {preview.skipped.length > 10 && <li>ほか{preview.skipped.length - 10}件</li>}
              </ul>
            </details>
          )}

          <div className="preview-actions">
            <button className="button" onClick={() => setPreview(null)}>
              やめる
            </button>
            <button
              className="button is-primary"
              onClick={confirmImport}
              disabled={preview.added.length === 0}
            >
              {preview.added.length}件を取り込む
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
