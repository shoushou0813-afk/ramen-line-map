import { useState } from "react";
import { createPost, uploadPostImage } from "../lib/api/posts";
import { GENRES } from "../data/lines";
import { toDateInputValue, validateVisitedOn } from "../lib/date";

/** 入力内容に問題があればエラーメッセージを返す。問題がなければ空文字 */
function validateInput({ shopName, rating, visitedOn }) {
  if (!shopName.trim()) return "店名を入力してください";
  if (rating === 0) return "評価を選択してください";
  return validateVisitedOn(visitedOn);
}

export default function PostForm({ session, stationId, onPosted }) {
  const [shopName, setShopName] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [memo, setMemo] = useState("");
  const [rating, setRating] = useState(0);
  const [visitedOn, setVisitedOn] = useState(() => toDateInputValue(new Date()));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loggedIn = Boolean(session);

  function handleImageChange(e) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  }

  function resetForm() {
    setShopName("");
    setMemo("");
    setGenre(GENRES[0]);
    setRating(0);
    setVisitedOn(toDateInputValue(new Date()));
    setImageFile(null);
    setImagePreview("");
  }

  async function handleSubmit() {
    const validationError = validateInput({ shopName, rating, visitedOn });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    let imageUrl = null;
    if (imageFile) {
      try {
        imageUrl = await uploadPostImage(imageFile, session.user.id);
      } catch (uploadError) {
        console.error(uploadError);
        setSaving(false);
        setError("画像のアップロードに失敗しました。もう一度試してください。");
        return;
      }
    }

    try {
      await createPost({
        session,
        stationId,
        shopName: shopName.trim(),
        genre,
        memo: memo.trim() || null,
        rating,
        visitedOn,
        imageUrl,
      });
    } catch (insertError) {
      console.error(insertError);
      setSaving(false);
      setError("保存に失敗しました。もう一度試してください。");
      return;
    }

    setSaving(false);
    resetForm();
    onPosted();
  }

  return (
    <div className="form">
      <h3 className="form-title">投稿する</h3>

      {!loggedIn && <p className="notice">投稿するにはログインしてください</p>}

      <input
        className="input"
        placeholder="店名"
        value={shopName}
        onChange={(e) => setShopName(e.target.value)}
        disabled={!loggedIn || saving}
      />

      <select
        className="input"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        disabled={!loggedIn || saving}
      >
        {GENRES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <div className="star-input">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={n <= rating ? "is-filled" : ""}
            onClick={() => setRating(n)}
            disabled={!loggedIn || saving}
            aria-label={`${n}点`}
          >
            {n <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>

      <label className="date-field">
        食べた日
        <input
          className="input"
          type="date"
          value={visitedOn}
          max={toDateInputValue(new Date())}
          onChange={(e) => setVisitedOn(e.target.value)}
          disabled={!loggedIn || saving}
        />
      </label>

      <textarea
        className="input textarea"
        placeholder="メモ"
        rows={3}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        disabled={!loggedIn || saving}
      />

      <input
        className="image-input"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        disabled={!loggedIn || saving}
      />

      {imagePreview && <img className="form-image-preview" src={imagePreview} alt="プレビュー" />}

      {error && <p className="error">{error}</p>}

      <button className="button primary" onClick={handleSubmit} disabled={!loggedIn || saving}>
        {saving ? "保存中..." : "記録する"}
      </button>
    </div>
  );
}
