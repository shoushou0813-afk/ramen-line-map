# ラーメン路線図マップ

![test](https://github.com/shoushou0813-afk/ramen-line-map/actions/workflows/test.yml/badge.svg)

駅を選ぶと、その駅周辺のラーメン記録を見られる個人開発のWebアプリ。
路線図上の丸の中の数字が、その駅に登録された記録の件数になっている。

**公開URL**: https://ramen-line-map.vercel.app


## できること

- **路線図タブ** … 5路線（中央線 / 山手線 / 田園都市線・半蔵門線 / 東横線 / 総武線）を切り替えて駅を選び、その駅のラーメン記録を見る・投稿する
- **リールタブ** … 路線に関係なく新着50件を流し見する。店名・駅名・ラーメンの種類で検索すると、当てはまる記録に絞り込める
- 投稿には5段階の星評価と写真を添えられる（写真は Supabase Storage に保存）
- 食べた日を投稿時に選べる（初期値は今日。未来の日付は選べない）
- Googleログイン。未ログインでも閲覧はできるが、投稿はできない
- 表示名はGoogleアカウントの名前とは別に、ヘッダーの「名前を変更」から自由に決められる（20文字以内）
- **レベルと称号** … 投稿者名の隣に「ラーメンマーク + レベル + 称号」が出る。投稿0件の Lv.0 から始まり、1件投稿するごとに1上がって最高 Lv.20。
  称号はレベル帯（見習い → 一人前 → 熟練 → 達人 → カリスマ）と一番多く投稿している種類で決まる（例：見習いジロリアン、カリスマ醤油党）。Lv.0 の人は空の丼で称号なし（マイアカウントには「ラーメンを投稿しよう！」と出る）。
  マークは一番多く投稿しているラーメンの種類で変わる（家系=海苔とほうれん草、二郎系=野菜山盛りに背脂・チャーシュー・にんにく、醤油=醤油さし、味噌=味噌のかたまり、塩=塩の瓶、つけ麺=箸で持ち上げた麺、その他=油そば）
- **マイアカウントタブ** … 自分のレベル・称号・種類ごとの投稿数と、自分が投稿した記録の一覧を見られる（ここから削除もできる）
- **レベルの非公開** … マイアカウントで「レベルを非公開にする」にチェックすると、ほかの人の画面では名前の横にマーク・レベル・称号が出なくなる（自分のマイアカウントとヘッダーには出る）

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

表示名はSupabaseの `user_metadata` に `display_name` として保存している。
名前1つのためにプロフィール用のテーブルを作るほどではないと判断した。
Googleログインのたびに上書きされる `name` とは別のキーにしてあるので、ログインし直しても消えない。

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
何度実行しても壊れないように書いてあるので、テーブルが増えたとき（ランクの公開設定の `rank_settings` など）も、同じファイルを丸ごと実行し直せばよい。

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

### 4. 起動

```bash
npm install
npm run dev
```

### 5. デプロイ（Vercel）

リポジトリをImportし、環境変数2つを登録するだけ。
デプロイ後、発行されたURLをSupabaseのRedirect URLsに追加すること。

## テストとCI

```bash
npm test
```

`src/data/lines.js` に対する単体テストを [src/data/lines.test.js](src/data/lines.test.js) に、
件数の集計と画像パスの取り出しに対する単体テストを [src/lib/api/posts.test.js](src/lib/api/posts.test.js) に、
表示名の選び方と入力チェックに対する単体テストを [src/lib/api/profile.test.js](src/lib/api/profile.test.js) に、
食べた日の表示と入力チェックに対する単体テストを [src/lib/date.test.js](src/lib/date.test.js) に、
レベル・称号・マークの種類の決め方に対する単体テストを [src/lib/rank.test.js](src/lib/rank.test.js) に置いている。
路線データが崩れると実害が出る箇所を確認している。

- `LINE_ORDER` に並ぶ路線が `LINES` に実在するか
- 渋谷のように複数路線に出てくる駅が、路線をまたいで同じ駅名になっているか
- `label`（駅名を丸のどちら側に置くか）が `top` / `bottom` / `left` / `right` のいずれかか
- `stationName(id)` が既存IDで正しい駅名を返し、未知のIDでは引数をそのまま返すか

GitHub Actions（[.github/workflows/test.yml](.github/workflows/test.yml)）で、pushするたびに上記が自動実行される。

## ディレクトリ構成

```
src/
├─ App.jsx                 タブ・ログイン状態・画面全体の組み立て
├─ data/lines.js           路線と駅の座標データ
├─ lib/supabase.js         Supabaseクライアントの生成
├─ lib/api/posts.js        投稿の取得・保存・削除（Supabase呼び出しはここに集約）
├─ lib/api/profile.js      表示名の取得・保存
├─ lib/api/rankSettings.js ランクの公開・非公開の取得・保存
├─ lib/date.js             日付の表示と入力チェック
├─ lib/rank.js             投稿数からレベル、一番多い種類からマークと称号を決める
└─ components/
   ├─ LineMap.jsx          SVGの路線図
   ├─ NameEditor.jsx       ヘッダーの表示名と「名前を変更」
   ├─ BackToTop.jsx        画面右下の「一番上に戻る」ボタン
   ├─ StationPanel.jsx     駅ごとの投稿エリア
   ├─ PostForm.jsx
   ├─ PostList.jsx
   ├─ MyPage.jsx           マイアカウント（自分のレベル・称号と投稿一覧）
   ├─ RamenMark.jsx        ラーメンの種類ごとのマーク（SVG）
   ├─ RankBadge.jsx        名前の隣に出す「マーク + レベル + 称号」
   ├─ Reel.jsx
   └─ Stars.jsx            星評価の表示
supabase/schema.sql        テーブル定義とRLSポリシー
```

## 制約

- Supabaseの無料プロジェクトは1週間アクセスがないと一時停止する

## 開発について

個人開発。画面設計、路線図の座標設計、データ構造、技術選定はすべて自分で決めた。
実装にはAI（Claude）を併用している。
