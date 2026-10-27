import { useState } from "react";
import { createPost, updatePost, uploadPostImage } from "../lib/api/posts";
import { GENRES } from "../data/lines";
import { postDateInputValue, toDateInputValue, validateVisitedOn } from "../lib/date";

/** 入力内容に問題があればエラーメッセージを返す。問題がなければ空文字 */
function validateInput({ shopName, rating, visitedOn }) {
  if (!shopName.trim()) return "店名を入力してください";
  if (rating === 0) return "評価を選択してください";
  return validateVisitedOn(visitedOn);
}

// post を渡すと、その投稿を編集するフォームになる（入力欄に今の内容が入り、保存で上書きする）
export default function PostForm({ session, stationId, onPosted, post = null, onCancel }) {
  const editing = Boolean(post);
  const [shopName, setShopName] = useState(post?.shop_name ?? "");
  const [genre, setGenre] = useState(post?.genre ?? GENRES[0]);
  const [memo, setMemo] = useState(post?.memo ?? "");
  const [rating, setRating] = useState(post?.rating ?? 0);
  const [visitedOn, setVisitedOn] = useState(() => (post ? postDateInputValue(post) : toDateInputValue(new Date())));
  const [imageFile, setImageFile] = useState(null);
  // 編集時に、今の写真をそのまま使う場合の URL。「写真を外す」で null にする
  const [currentImageUrl, setCurrentImageUrl] = useState(post?.image_url ?? null);
  const [imagePreview, setImagePreview] = useState(post?.image_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loggedIn = Boolean(session);

  function handleImageChange(e) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : currentImageUrl ?? "");
  }

  function removeImage() {
    setImageFile(null);
    setCurrentImageUrl(null);
    setImagePreview("");
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

    let imageUrl = currentImageUrl;
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

    const fields = { shopName: shopName.trim(), genre, memo: memo.trim() || null, rating, visitedOn, imageUrl };
    try {
      if (editing) {
        await updatePost(post, fields);
      } else {
        await createPost({ session, stationId, ...fields });
      }
    } catch (saveError) {
      console.error(saveError);
      setSaving(false);
      setError("保存に失敗しました。もう一度試してください。");
      return;
    }

    setSaving(false);
    if (!editing) resetForm();
    onPosted();
  }

  return (
    <div className="form">
      <h3 className="form-title">{editing ? "記録を編集" : "投稿する"}</h3>

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
      {editing && imagePreview && (
        <button type="button" className="link-button" onClick={removeImage} disabled={saving}>
          写真を外す
        </button>
      )}

      {error && <p className="error">{error}</p>}

      <button className="button primary" onClick={handleSubmit} disabled={!loggedIn || saving}>
        {saving ? "保存中..." : editing ? "保存する" : "記録する"}
      </button>
      {editing && (
        <button className="button wide" onClick={onCancel} disabled={saving}>
          キャンセル
        </button>
      )}
    </div>
  );
}
