import { useState } from "react";
import { supabase } from "../lib/supabase";
import { GENRES } from "../data/lines";

export default function PostForm({ session, stationId, onPosted }) {
  const [shopName, setShopName] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loggedIn = Boolean(session);

  async function handleSubmit() {
    if (!shopName.trim()) {
      setError("店名を入力してください");
      return;
    }
    setSaving(true);
    setError("");

    // user_id は RLS のポリシーと突き合わせられるので、必ず本人の id を入れる。
    // user_name は表示のたびに auth 側を引きに行くのが面倒なので、
    // 投稿時点の名前をそのまま持たせている（あえて非正規化）
    const { error: insertError } = await supabase.from("posts").insert({
      station_id: stationId,
      shop_name: shopName.trim(),
      genre,
      memo: memo.trim() || null,
      user_id: session.user.id,
      user_name: session.user.user_metadata?.name ?? "名無し",
    });

    setSaving(false);

    if (insertError) {
      setError("保存に失敗しました。もう一度試してください。");
      console.error(insertError);
      return;
    }

    setShopName("");
    setMemo("");
    setGenre(GENRES[0]);
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

      <textarea
        className="input textarea"
        placeholder="メモ"
        rows={3}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        disabled={!loggedIn || saving}
      />

      {error && <p className="error">{error}</p>}

      <button className="button primary" onClick={handleSubmit} disabled={!loggedIn || saving}>
        {saving ? "保存中..." : "記録する"}
      </button>
    </div>
  );
}
