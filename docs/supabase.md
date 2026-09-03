# Supabaseまわりの関数一覧

`src/lib/supabase.js` を通じてSupabase（データベース・認証・画像保存をまとめて提供するサービス）とやり取りしている関数のまとめ。テーブル定義やRLS（行単位アクセス制御）などのSQL側の設計は `supabase/schema.sql` にあり、そちらの説明は末尾の補足にまとめる。

## src/lib/supabase.js

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `supabase` | `export const` | `createClient(url, anonKey)` で作られるSupabaseクライアント。以降すべてのファイルはこの1つのインスタンス経由でDB・認証・Storageにアクセスする。`url` / `anonKey` は `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` から取得する。 |
| `isConfigured` | `export const` (boolean) | 環境変数が両方揃っているか。`createClient` は空文字を渡すと例外を投げて画面が真っ白になるため、未設定時はダミー値でクライアントを作り、この値を見て `main.jsx` が `SetupNotice` を表示する。 |

## src/lib/image.js

投稿写真まわりのうち、通信を伴わない部分。保存パスの組み立てをここに閉じ込めている（RLSのポリシーが「パスの1階層目 = 自分の user_id」を前提にしているため）。Supabaseクライアントを読み込まないので、単体テストがネットワーク層に依存しない。

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `BUCKET` | `export const` | バケット名 `post-images`。 |
| `MAX_IMAGE_BYTES` / `ALLOWED_IMAGE_TYPES` | `export const` | 5MB、JPEG / PNG / WebP。`schema.sql` のバケット設定と同じ値を持たせている。 |
| `validateImage(file)` | `export function` | アップロード前の検証。問題があれば表示用のメッセージを、無ければ `null` を返す純粋関数。バケット側にも同じ制限があるので、ここは通信前に気づかせるためのもの。 |
| `storagePathFromUrl(url)` | `export function` | 公開URLから storage 上のパス（`{user_id}/xxxx.jpg`）を取り出す。削除に必要。`URL` で解析し、バケット名以降を取り出してデコードする。解析できなければ `null`。 |
| `extensionFor(type)` | `export function` | Content-Type から拡張子を決める。ファイル名由来だと拡張子なしのファイルでパスが壊れるため。 |

## src/lib/storage.js

Storage との通信部分。検証とパスの組み立ては `image.js` 側にある。

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `uploadImage(file, userId)` | `export async function` | `{userId}/{ランダムなuuid}.{拡張子}` のパスでアップロードし、公開URLを返す。 |
| `removeImage(url)` | `export async function` | 公開URLからパスを求めてStorageから削除する。 |

## src/App.jsx

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| （ログイン状態の `useEffect`） | React Hook | 初回に `supabase.auth.getSession()` でログイン済みかを確認し、以後は `onAuthStateChange` でログイン／ログアウトを受け取って `session` を更新する。 |
| （件数取得の `useEffect`） | React Hook | `supabase.from("posts").select("station_id")` で全投稿の駅IDだけを取得し、ブラウザ側で駅ごとに数えて `counts` に入れる。駅ごとに問い合わせると通信回数が増えるため1回にまとめている。 |
| （投稿取得の `useEffect`） | React Hook | 選択中の駅に絞って新着順に取得し、`loaded` に「どの駅のデータか」と一緒に保存する。クリーンアップで `alive` を落とし、駅を素早く切り替えた時に古いリクエストの結果が新しい一覧を上書きしないようにしている。 |
| `postsLoading` / `posts` | 導出値 | `loaded.stationId` が表示中の `stationId` と食い違っている間が読み込み中。state を増やさずに導出することで、切り替え直後に前の駅の投稿が残る状態を作れなくしている。 |
| `refresh()` | `useCallback` | `reloadKey` を1つ進めて、上記2つの `useEffect` を再実行させる。投稿・削除の後に呼ばれる。 |
| `signIn()` / `signOut()` | 非同期関数 | `signInWithOAuth({ provider: "google" })` でGoogleログイン画面へ遷移／`signOut()` でログアウト。戻り先の `redirectTo` は本番とlocalhostで変わるため `window.location.origin` を使う。 |

## src/components/PostForm.jsx

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `handleImageChange(e)` | イベントハンドラ | 選ばれたファイルを `validateImage` で検証し、問題があればその場でメッセージを出して選択を取り消す。問題なければプレビュー用URLを作る（この時点では通信しない）。 |
| `handleSubmit()` | 非同期関数 | 入力チェック → 画像があれば `uploadImage` → `supabase.from("posts").insert({...})` の順。`user_id` には必ず本人のIDを入れる。RLSの `auth.uid() = user_id` と一致しないとINSERTが拒否される。成功後はフォームを初期化して `onPosted()`（＝`refresh`）を呼ぶ。 |

## src/components/PostList.jsx

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `handleDelete(post)` | 非同期関数 | 確認ダイアログの後、`delete().eq("id", post.id)` で投稿を削除し、画像があれば `removeImage` でStorageからも消す。失敗時は画面にエラーを出す。他人の投稿を消せないのはRLSがサーバー側で強制しているため、ここでの確認はUI上のもの。 |
| `formatDate(iso)` | 関数（モジュール内限定） | ISO文字列を `YYYY/M/D` に整形する。 |

## src/components/Reel.jsx

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| （`useEffect` 内の非同期処理） | React Hook | 路線を問わず全投稿を新着順に最大50件取得する。`alive` フラグで、取得中にタブが切り替わった後の不要な `setState` を防いでいる。 |

## 補足（用語・SQL側の設計）

- **Supabase**：PostgreSQL・認証・ファイルストレージ（Storage）をまとめて提供するBaaS。このアプリではDBに投稿データを、Storageに投稿画像を保存する。
- **RLS（Row Level Security／行単位アクセス制御）**：PostgreSQLの機能で、行ごとに誰が読める・書けるかをDB側で強制する。`schema.sql` に「誰でもSELECTできる」「`auth.uid() = user_id` の行だけINSERT/DELETEできる」の3つのポリシーがある。anonキーはブラウザに露出するため、これが無いと他人のデータを操作できてしまう。
- **`auth.uid()`**：リクエストに付いているログイントークン（JWT）から、今ログインしているユーザーのIDを取り出すSupabase提供の関数。
- **Storageバケット（`post-images`）**：画像専用の保存領域。ファイルパスを `{user_id}/xxxx.jpg` に統一することで、RLSと同じ考え方をStorageの権限チェックにも適用している。バケット自体にもサイズ上限（5MB）と許可するMIMEタイプを設定してあり、クライアントの検証を迂回されても無制限にはアップロードできない。
- **入力の長さ制限**：`shop_name` は100文字、`memo` は500文字を `check` 制約でDB側にも持たせている。クライアントの `maxLength` だけだとAPIを直接叩けば回避できるため。
