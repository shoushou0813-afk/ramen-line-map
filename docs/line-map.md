# 路線図まわりの関数・変数一覧

`src/data/lines.js`・`src/lib/lineMap.js`・`src/components/LineMap.jsx` で定義されている関数・変数のまとめ。

## src/data/lines.js

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `LINES` | `export const` (object) | 路線ごとの定義(`id`, `name`, `color`, `viewBox`, `loop`, `stations`)。`color` は線の色。`stations` の各駅は `id`, `name`, `x`, `y`, （必要なら）`corner` を持つ。駅名の位置は `labelSide` で自動で決まる。 |
| `LINE_ORDER` | `export const` (array) | タブなどに表示する路線の順番。`["chuo", "yamanote", "denentoshi", "toyoko", "sobu"]`。オブジェクトのキー順に依存しないよう明示的に定義。 |
| `STATION_NAMES` | `const` (object, モジュール内限定) | 駅ID→駅名の逆引き辞書。`LINE_ORDER` の順に全路線の駅を走査して構築。複数路線をまたいで同じIDの駅がある場合は最初に見つかった名前を採用。 |
| `stationName(id)` | `export function` | `STATION_NAMES` から駅名を引く。見つからない場合は `id` をそのまま返す。 |
| `GENRES` | `export const` (array) | ジャンル一覧（家系・二郎系・醤油・味噌・塩・つけ麺・その他）。路線図とは別データだが同ファイルに定義。 |

## src/lib/lineMap.js

大きさはすべて「スマホで見たときの px」で決め、`mapUnit` を掛けて viewBox の座標に直す。路線ごとに viewBox の幅が違っても、文字や丸が同じ大きさに見える。

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `PHONE_MAP_WIDTH` / `MAP_PADDING` / `NAME_PX` / `TOP_STATIONS_LIMIT` | `export const` | スマホでの路線図の幅（340）、まわりの余白（8）、駅名と件数の文字の大きさ（12）、記録が多い駅のボタンの数（6）。 |
| `mapUnit(viewBox)` | `export function` | スマホで 1px にあたる viewBox 上の長さ。 |
| `paddedViewBox(viewBox)` | `export function` | 上下左右に余白を足した viewBox。端の駅名や大きい丸がはみ出さないようにする。 |
| `stationRadius(count, selected)` | `export function` | 駅の丸の半径（px）。記録なしは 5 の点、記録ありは件数が多いほど大きく、16 で頭打ち。 |
| `labelSide(line, index)` | `export function` | 駅名を置く側。基本は上、上に線が出ている駅は下、上下に線が通る駅は図の外側の横。 |
| `topStations(line, counts, limit)` | `export function` | その路線で記録が多い駅を多い順に返す。 |

## src/components/LineMap.jsx

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `buildSegments(line)` | `function` (モジュール内限定) | 隣り合う駅を結ぶ線分の座標(`points`)を配列で生成。`from.corner` があればそこで折り曲げて斜め線を避ける。`line.loop` が `true` なら最後の駅と最初の駅を結ぶ線分も追加。戻り値は `{ key, points }[]`。 |
| `labelAttrs(st, side, r, unit)` | `function` (モジュール内限定) | 駅名ラベルの位置を、置く側・丸の半径に応じて計算し、`{ x, y, textAnchor }` を返す。 |
| `LineMap({ line, counts, selectedId, onSelect })` | `export default function` (React コンポーネント) | 路線図本体。線（縁→路線の色）→ 丸 → 文字の順で描画。記録がない駅は灰色の点で数字を出さない。駅の丸・見えない押せる範囲・Enter/Spaceキーで選択でき、`onSelect(st.id)` を呼ぶ。下に凡例と「記録が多い駅」のボタンを出す。 |

## 補足

- SVG座標系は左上が原点、Y軸は下方向が正（数学のグラフと上下逆）。
- 駅の `id` は路線をまたいで共通のIDを使う設計（例: 渋谷・新宿は複数路線に登場するが同じ `id`）。これにより投稿件数（`counts`）を路線間で共有できる。
