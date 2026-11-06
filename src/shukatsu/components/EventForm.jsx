import { useState } from "react";
import { EVENT_TYPES } from "../data/eventTypes";
import { toMinutes } from "../lib/date";

/**
 * 予定の追加・編集フォーム。画面全体を覆うモーダル（重ねて出す小窓）として表示する。
 *
 * React では入力欄の値を state に持たせ、value と onChange の両方を渡す。
 * これを「制御コンポーネント」と呼ぶ。入力欄の中身とプログラムが持つ値が
 * 常に一致するので、保存時に DOM を読みに行かなくて済む。
 */
export default function EventForm({ initial, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");

  // 1項目だけ差し替える。{...前の値, 変えたい項目: 新しい値} が React での定番の書き方
  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  function handleSubmit(e) {
    e.preventDefault(); // ページがリロードされる既定の送信動作を止める
    const company = form.company.trim();
    if (!company) return setError("企業名を入れてください");
    if (!form.date) return setError("日付を入れてください");

    const start = toMinutes(form.start);
    const end = toMinutes(form.end);
    if (start != null && end != null && end <= start) {
      return setError("終了時刻は開始時刻より後にしてください");
    }
    if (start == null && end != null) {
      return setError("終了時刻だけの入力はできません");
    }

    onSave({ ...form, company, place: form.place.trim(), memo: form.memo.trim() });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      {/* 中身をクリックしたときに背景のクリック（＝閉じる）が動かないように止める */}
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 className="modal-title">{initial.id ? "予定を編集" : "予定を追加"}</h2>

        <label className="field">
          <span className="field-label">企業名</span>
          <input
            className="input"
            value={form.company}
            onChange={set("company")}
            placeholder="例）〇〇商事"
            autoFocus
          />
        </label>

        <div className="field">
          <span className="field-label">種別</span>
          <div className="type-picker">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={form.type === t.id ? "type-chip is-active" : "type-chip"}
                style={
                  form.type === t.id
                    ? { background: t.bg, borderColor: t.color, color: t.color }
                    : undefined
                }
                onClick={() => setForm((prev) => ({ ...prev, type: t.id }))}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field-label">日付</span>
          <input className="input" type="date" value={form.date} onChange={set("date")} />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field-label">開始</span>
            <input className="input" type="time" value={form.start} onChange={set("start")} />
          </label>
          <label className="field">
            <span className="field-label">終了</span>
            <input className="input" type="time" value={form.end} onChange={set("end")} />
          </label>
        </div>
        <p className="hint">
          時間が分からなければ空のままでよい（「時間未定」の帯に入る）。
          終了だけ空なら、種別ごとの目安の長さで表示する。
        </p>

        <label className="field">
          <span className="field-label">場所 / URL</span>
          <input
            className="input"
            value={form.place}
            onChange={set("place")}
            placeholder="例）オンライン（Zoom）/ 本社ビル3F"
          />
        </label>

        <label className="field">
          <span className="field-label">メモ</span>
          <textarea
            className="input textarea"
            rows={3}
            value={form.memo}
            onChange={set("memo")}
            placeholder="持ち物、提出方法、担当者名など"
          />
        </label>

        <label className="checkbox">
          <input type="checkbox" checked={form.done} onChange={set("done")} />
          <span>提出・参加済み</span>
        </label>

        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          {initial.id && (
            <button type="button" className="button is-danger" onClick={() => onDelete(initial.id)}>
              削除
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="button" onClick={onClose}>
            キャンセル
          </button>
          <button type="submit" className="button is-primary">
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
