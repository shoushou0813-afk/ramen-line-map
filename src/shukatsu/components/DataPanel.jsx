import { useRef, useState } from "react";
import { backupFileName, buildBackup, parseBackup } from "../lib/backup";

/**
 * 予定の書き出し・読み込み。
 * 予定はこの端末のブラウザにしか無いので、機種変更やデータ消失に備えて
 * ファイルに出せるようにしている。
 */
export default function DataPanel({ events, onImport }) {
  const fileRef = useRef(null);
  const [message, setMessage] = useState("");

  function handleExport() {
    // ブラウザからファイルを保存させる定番のやり方。
    // 中身から一時的なURLを作り、見えないリンクを自動でクリックする。
    const blob = new Blob([buildBackup(events)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFileName();
    // 画面には出ないが、いったんページに入れてからクリックする。
    // ページに入れないと download（保存するファイル名）が無視されることがある
    document.body.appendChild(a);
    a.click();
    a.remove();
    // 一時URLは放っておくとメモリに残るので捨てるが、
    // クリックの直後に消すと保存が始まる前に無効になるため、1拍おいてから消す
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`${events.length}件を書き出しました`);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseBackup(await file.text());
      const ok = window.confirm(
        `${imported.length}件を読み込みます。今このアプリに入っている${events.length}件は置き換わります。よろしいですか？`
      );
      if (ok) {
        onImport(imported);
        setMessage(`${imported.length}件を読み込みました`);
      }
    } catch (err) {
      setMessage(`読み込めませんでした：${err.message}`);
    }
    // 同じファイルをもう一度選んでも反応するように、選択状態を空に戻す
    e.target.value = "";
  }

  return (
    <div className="data-panel">
      <div className="data-actions">
        <button className="button" onClick={handleExport} disabled={events.length === 0}>
          ファイルに書き出す
        </button>
        <button className="button" onClick={() => fileRef.current?.click()}>
          ファイルから読み込む
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          hidden
        />
      </div>
      <p className="hint">
        予定はこの端末のブラウザに保存されています。機種変更では引き継がれず、
        しばらく使わないとブラウザ側で消えることもあるので、ときどき書き出しておくと安心です。
      </p>
      {message && <p className="data-message">{message}</p>}
    </div>
  );
}
