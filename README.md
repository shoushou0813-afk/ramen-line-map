# ラーメン路線図マップ

![test](https://github.com/shoushou0813-afk/ramen-line-map/actions/workflows/test.yml/badge.svg)

駅を選ぶと、その駅周辺のラーメン記録を見られる個人開発のWebアプリ。
路線図上の丸の中の数字が、その駅に登録された記録の件数になっている。

**公開URL**: https://ramen-line-map.vercel.app


## できること

- **路線図タブ** … 5路線（中央線 / 山手線 / 田園都市線・半蔵門線 / 東横線 / 総武線）を切り替えて駅を選び、その駅のラーメン記録を見る・投稿する
- **リールタブ** … 路線に関係なく新着50件を流し見する
- 投稿には5段階の星評価と写真を添えられる（写真は Supabase Storage に保存）
- Googleログイン。未ログインでも閲覧はできるが、投稿はできない

## なぜこの構成にしたか

### サーバーを書かず Supabase にした

当初は Node.js + Express でAPIを書く構成で設計していたが、この規模だと
「Expressを1枚挟むだけの層」になり、CORS設定とデプロイ先が1つ増えるコストに見合わなかった。
Supabaseは中身がPostgreSQLなので、後からサーバーを挟む形に移行しても
テーブル設計はそのまま使える。まず動くものを出すことを優先した。

代わりにアクセス制御をアプリ側で書けなくなるため、**RLS（Row Level Security）**で担保している。
anonキーはブラウザに露出する前提のキーなので、RLSを有効にしないと
誰でも他人の投稿を削除できてしまう。

```sql
create policy "本人だけ削除できる"
  on public.posts for delete
  using (auth.uid() = user_id);
```

### 認証をGoogleログインのみにした

当初はアカウント名とパスワードを自分で保存する設計だった。
しかし利用者のパスワードを預かれば、漏えいしたときの責任も自分が負うことになる。
そこまで負い切れないと判断し、Googleログインに切り替えた。
メール認証を用意すると確認メールの実装も必要になる点も踏まえている。

## 工夫した点

### 1. 路線図を「地理」ではなく「見やすさ」で設計した

実際の緯度経度で描くと、路線が斜めに走って駅名が重なり、スマホで読めなくなる。
そこで実際の地図は捨て、**駅の座標を手打ちで決める方式**にした。

```js
{ id: "shinokubo", name: "新大久保", x: 400, y: 55, label: "top", corner: [470, 55] },
```

- `label` … 駅名を丸のどちら側に置くか。自動配置だと重なるので上下左右を手で振り分けた
- `corner` … 次の駅へ行く途中で曲がる点。斜めの線を出さず、路線図らしい直角の折れ線にするために使う
- `loop` … 山手線だけ、最後の駅と最初の駅を結ぶ

SVGの `viewBox` を指定してあるので、スマホでもPCでも自動で拡大縮小される。
px単位でのレスポンシブ対応が不要になった。

### 2. 駅IDを路線をまたいで共通にした

渋谷は東横線と田園都市線と山手線に出てくるが、すべて `shibuya` という同じIDにしている。
これによりどの路線から見ても件数が一致し、駅の重複を意識せずに済む。

### 3. 件数の取得を1リクエストにまとめた

駅ごとに件数を問い合わせると、山手線だけで13回リクエストが飛ぶ。
`station_id` だけを全件取得してブラウザ側で数える方式にして、1回に抑えた。

```js
const { data } = await supabase.from("posts").select("station_id");
```

件数が数万件規模になったらSQL側の `group by` に切り替える前提で、
コードにその旨をコメントとして残してある。

### 4. 投稿者名をあえて非正規化した

表示のたびに `auth.users` を引きに行くのが面倒だったので、
投稿時点の名前を `posts.user_name` に持たせている。
名前を変えても過去の投稿には反映されないというトレードオフを承知の上で採用した。

ただしこの値をブラウザから送らせると、RLS は `user_id` しか検証しないため
本人のまま好きな表示名を名乗れてしまう。そこで `user_id` と `user_name` は
クライアントから送らず、BEFORE INSERT トリガー `set_post_author` が
ログイン中のユーザーの値で必ず上書きするようにした。

```sql
new.user_id := auth.uid();
```

ただし `auth.uid()` は service_role キーや SQL Editor からの操作でも null に
なるため、無条件に上書きすると一括投入や手動メンテができなくなる。
null のときは上書きせず素通りさせている。未ログインのブラウザも null だが、
そちらは RLS の `with check (auth.uid() = user_id)` が弾くので穴にはならない。

## 詰まった点と解決

### SVGの座標系で上下が逆になった

`y` を大きくすれば上に行くと思っていたが、SVGは**左上が原点で、yは下方向に増える**。
数学のグラフと逆で、路線図が上下反転した状態で描画された。
`lines.js` のy座標をすべて「上から数えた値」に書き直して解決。

### 本番でログイン後にlocalhostへ飛ばされた

Supabaseの Redirect URLs にVercelのURLを登録していなかったため。
ローカルでは動くので気づきにくい。
`redirectTo` は `window.location.origin` にして、環境ごとに固定値を書かないようにした。

### 描画順で線が丸の上に乗った

SVGは後に書いた要素が手前に来る。丸を先に描いたせいで、駅の丸の上を線が横切っていた。
**線 → 丸 → 文字**の順に描くよう並べ替えて解決。

## 今後やりたいこと

- 件数集計を `group by` に切り替える
- 路線の追加（`lines.js` に座標を足すだけで増やせる構造にしてある）
- 「行きたい」ブックマーク機能

## セットアップ

### 1. Supabase

プロジェクトを作成し、SQL Editor で `supabase/schema.sql` を実行する。
既存のプロジェクトでも、`set_post_author` トリガーを反映するために再実行する
（`create or replace` と `if not exists` で書いてあるので何度流しても問題ない）。

### 2. Googleログイン

1. Google Cloud Console で OAuth クライアント ID（ウェブアプリケーション）を作成
2. Supabase の Authentication → Providers → Google に Client ID と Secret を登録
3. Supabase 側に表示される Callback URL を Google の「承認済みのリダイレクト URI」に登録
4. Authentication → URL Configuration で Site URL と Redirect URLs を設定

### 3. 環境変数

`.env.example` をコピーして `.env` を作る。

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. サンプル投稿を入れる（任意）

空の画面だと見た目が分からないので、デモ用のサンプル投稿を一括投入できる。

```
npm run seed -- --dry-run   # 何も書き込まず、入る予定の件数と中身を表示
npm run seed                # 実際に投入する
```

`.env` に `SUPABASE_SERVICE_ROLE_KEY` が必要（`.env.example` を参照）。
service_role キーは RLS を全て素通りする管理者用の鍵なので、ローカルの `.env`
に置いたままにして、Git にも Vercel のクライアント側にも出さないこと。
`VITE_` を付けるとブラウザのバンドルに埋め込まれるので絶対に付けない。

`posts.user_id` は `auth.users` への外部キーなので、先に一度アプリで
Google ログインしておく必要がある。そのアカウントの投稿として入る。

店名は実在の店と紛らわしくないよう架空の語を組み合わせて生成している。
`(station_id, shop_name)` が既にあるものは飛ばすので、何度実行しても増えない。

### 5. 起動

```bash
npm install
npm run dev
```

### 6. デプロイ（Vercel）

リポジトリをImportし、環境変数2つを登録するだけ。
デプロイ後、発行されたURLをSupabaseのRedirect URLsに追加すること。

## テストとCI

```bash
npm test
```

`src/data/lines.js` に対する単体テストを [src/data/lines.test.js](src/data/lines.test.js) に置いている。
路線データが崩れると実害が出る箇所を確認している。

- `LINE_ORDER` に並ぶ路線が `LINES` に実在するか
- 渋谷のように複数路線に出てくる駅が、路線をまたいで同じ駅名になっているか
- `label`（駅名を丸のどちら側に置くか）が `top` / `bottom` / `left` / `right` のいずれかか
- `stationName(id)` が既存IDで正しい駅名を返し、未知のIDでは引数をそのまま返すか

サンプル投稿の生成についても [scripts/seed-data.test.js](scripts/seed-data.test.js) で
確認している。壊れたデータを本番のDBに流し込まないためのもの。

- `station_id` が実在する駅だけか、全駅に最低1件あるか
- `genre` が `GENRES` に収まり、`rating` がDBの check 制約と同じ 1〜5 か
- 同じ駅に同じ店名が重複しないか（再実行時のスキップ判定が効く前提）
- 何度呼んでも同じ結果になるか（再実行しても投稿が増えない前提）

GitHub Actions（[.github/workflows/test.yml](.github/workflows/test.yml)）で、pushするたびに上記が自動実行される。

## ディレクトリ構成

```
src/
├─ App.jsx                 タブ・ログイン状態・データ取得
├─ data/lines.js           路線と駅の座標データ
├─ lib/supabase.js
└─ components/
   ├─ LineMap.jsx          SVGの路線図
   ├─ StationPanel.jsx     駅ごとの投稿エリア
   ├─ PostForm.jsx
   ├─ PostList.jsx
   ├─ Reel.jsx
   └─ Stars.jsx            星評価の表示
supabase/schema.sql        テーブル定義とRLSポリシー
scripts/
├─ seed.js                 サンプル投稿の一括投入（ローカル実行）
└─ seed-data.js            投入するサンプル投稿の組み立て
```

## 制約

- Supabaseの無料プロジェクトは1週間アクセスがないと一時停止する

## 開発について

個人開発。画面設計、路線図の座標設計、データ構造、技術選定はすべて自分で決めた。
実装にはAI（Claude）を併用している。
