# Supabaseまわりの関数一覧

`src/lib/supabase.js` を通じてSupabase（データベース・認証・画像保存をまとめて提供するサービス）とやり取りしている関数のまとめ。テーブル定義やRLS（行単位アクセス制御）などのSQL側の設計は `supabase/schema.sql` にあり、そちらの説明は末尾の補足にまとめる。

## src/lib/supabase.js

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `supabase` | `export const` | `createClient(url, anonKey)` で作られるSupabaseクライアント。以降すべてのファイルはこの1つのインスタンス経由でDB・認証・Storageにアクセスする。`url` / `anonKey` は `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` という環境変数から取得し、未設定なら `console.error` で気づけるようにしてある。 |

## src/App.jsx

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `loadCounts()` | `useCallback` でメモ化された非同期関数 | `supabase.from("posts").select("station_id")` で全投稿の `station_id` だけ取得し、手元（JavaScript側）で駅ごとに件数を数えて `counts` state に入れる。駅の数だけ問い合わせると通信回数が増えるため、1回の問い合わせで済ませている。 |
| `loadPosts()` | `useCallback` でメモ化された非同期関数 | 選択中の駅（`stationId`）に絞って `posts` テーブルを新着順（`order("created_at", { ascending: false })`）に取得し、`posts` state に入れる。 |
| `refresh()` | `useCallback` でメモ化された関数 | `loadCounts()` と `loadPosts()` をまとめて呼び直す。投稿・削除の後に一覧と件数の両方を最新化するために使う。 |
| `signIn()` | 非同期関数 | `supabase.auth.signInWithOAuth({ provider: "google" })` を呼び、Googleのログイン画面へ遷移させる。ログイン後に戻ってくるURL（`redirectTo`）はVercel本番とlocalhostで変わるため、決め打ちせず `window.location.origin`（今アクセスしているオリジン）を使う。 |
| `signOut()` | 非同期関数 | `supabase.auth.signOut()` を呼び、ログアウトする。 |
| （`useEffect` 内の匿名処理） | React Hook | 初回マウント時に `supabase.auth.getSession()` で「すでにログイン済みか」を確認して `session` state にセットし、以後は `supabase.auth.onAuthStateChange(...)` でログイン／ログアウトの変化を継続的に受け取って `session` state を更新する。 |

## src/components/PostForm.jsx

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `uploadImage(file, userId)` | モジュール内限定の非同期関数 | 選んだ画像ファイルをStorageの `post-images` バケットへアップロードする。保存パスは `"{userId}/ランダムなuuid.拡張子"` の形（`crypto.randomUUID()` でランダムなIDを生成）。これはSQL側のポリシーが「パスの1階層目 = 自分のuser_id」であることを前提にしているため。アップロード後、`getPublicUrl(path)` で公開URLを組み立てて返す。 |
| `handleImageChange(e)` | イベントハンドラ | `<input type="file">` で選ばれたファイルを `imageFile` state に保存し、`URL.createObjectURL(file)` でブラウザ内だけで見られるプレビュー用URLを作って `imagePreview` にセットする（Supabaseへの通信はまだ発生しない）。 |
| `handleSubmit()` | 非同期関数 | フォーム送信の本体。入力チェック（店名・評価が空でないか）→画像があれば `uploadImage()` でアップロード→`supabase.from("posts").insert({...})` で1行追加、という順で処理する。`user_id` には必ずログイン中の本人ID（`session.user.id`）を入れる。これがSQL側のRLSポリシー（`auth.uid() = user_id` でないとINSERTを拒否する設定）と一致していないと保存に失敗する。成功したらフォームをリセットし、親から渡された `onPosted()`（＝`App.jsx` の `refresh`）を呼んで一覧を更新させる。 |

## src/components/PostList.jsx

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `storagePathFromUrl(url)` | モジュール内限定の関数 | Storageの公開URL（例: `https://.../post-images/自分のid/xxxx.jpg`）から、削除に必要な相対パス（`自分のid/xxxx.jpg` の部分）だけを取り出す。 |
| `handleDelete(post)` | 非同期関数 | 確認ダイアログの後、`supabase.from("posts").delete().eq("id", post.id)` で該当行を削除し、画像があれば `storagePathFromUrl` で求めたパスを `supabase.storage.from("post-images").remove([path])` でStorageからも削除する。他人の投稿を消せないのはRLSがサーバー側で強制しているためで、ここではUI側の確認だけを取っている。最後に `onChanged()`（＝`refresh`）を呼んで一覧を更新する。 |

## src/components/Reel.jsx

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| （`useEffect` 内の匿名非同期処理） | React Hook | 路線を問わず全投稿を新着順に最大50件（`.order("created_at", { ascending: false }).limit(50)`）取得し、リール（縦スクロールの一覧）用の state にセットする。`alive` フラグで、取得中にタブが切り替わった後の不要な `setState` を防いでいる。 |

## 補足（用語・SQL側の設計）

- **Supabase**：PostgreSQLデータベース・認証・ファイルストレージ（Storage）をまとめて提供するBaaS（Backend as a Service）。このアプリではDBに投稿データを、Storageに投稿画像を保存する。
- **RLS（Row Level Security／行単位アクセス制御）**：`supabase/schema.sql` の `alter table public.posts enable row level security;` 以下で設定されている、PostgreSQLの機能。「誰でもSELECTできる」「`auth.uid() = user_id` の行だけINSERT/DELETEできる」という3つのポリシーがあり、ブラウザに公開される `anonKey` だけでは他人のデータを書き換え・削除できないようにしている。上記の関数群がSupabaseに送るクエリは、最終的にすべてこのポリシーを通過できるかどうかでサーバー側から許可・拒否される。
- **`auth.uid()`**：SQL側でSupabaseが用意している関数。リクエストに付いているログイントークン（JWT）から、今ログインしているユーザーのIDを取り出す。
- **Storageバケット（`post-images`）**：画像ファイル専用の保存領域。ファイルパスを `"{user_id}/xxxx.jpg"` の形に統一することで、RLSと同じ考え方（1階層目のフォルダ名が自分のuser_idか）をStorage側の権限チェックにも適用している。
