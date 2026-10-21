import { useState } from "react";
import { displayName, updateDisplayName, validateDisplayName, MAX_DISPLAY_NAME_LENGTH } from "../lib/api/profile";

// ヘッダーに出す自分の名前。「名前を変更」から Google の名前とは別の名前に変えられる。
// 1行目に badge と名前、2行目に「名前を変更」と children（ログアウトボタン）を並べる
export default function NameEditor({ user, badge, children }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEditing() {
    setName(displayName(user));
    setError("");
    setEditing(true);
  }

  async function handleSave() {
    const validationError = validateDisplayName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      await updateDisplayName(name);
    } catch (saveError) {
      console.error(saveError);
      setSaving(false);
      setError("名前を保存できませんでした。もう一度試してください。");
      return;
    }

    setSaving(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <>
        <div className="auth-user">
          {badge}
          <span className="auth-name">{displayName(user)}</span>
        </div>
        <div className="auth-actions">
          <button className="tab" onClick={startEditing}>
            名前を変更
          </button>
          {children}
        </div>
      </>
    );
  }

  return (
    <div className="name-editor">
      <input
        className="input name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={MAX_DISPLAY_NAME_LENGTH}
        disabled={saving}
        aria-label="表示名"
      />
      <button className="tab" onClick={handleSave} disabled={saving}>
        {saving ? "保存中..." : "保存"}
      </button>
      <button className="tab" onClick={() => setEditing(false)} disabled={saving}>
        キャンセル
      </button>
      {error && <p className="error name-error">{error}</p>}
    </div>
  );
}
