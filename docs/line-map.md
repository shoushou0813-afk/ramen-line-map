# 路線図まわりの関数・変数一覧

`src/data/lines.js` と `src/components/LineMap.jsx` で定義されている関数・変数のまとめ。

## src/data/lines.js

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `LINES` | `export const` (object) | 路線ごとの定義(`id`, `name`, `viewBox`, `loop`, `stations`)。`stations` の各駅は `id`, `name`, `x`, `y`, `label`, （必要なら）`corner` を持つ。座標は地理的正確さより見やすさ優先で手打ち。 |
| `LINE_ORDER` | `export const` (array) | タブなどに表示する路線の順番。`["chuo", "yamanote", "denentoshi", "toyoko"]`。オブジェクトのキー順に依存しないよう明示的に定義。 |
| `STATION_NAMES` | `const` (object, モジュール内限定) | 駅ID→駅名の逆引き辞書。`LINE_ORDER` の順に全路線の駅を走査して構築。複数路線をまたいで同じIDの駅がある場合は最初に見つかった名前を採用。 |
| `stationName(id)` | `export function` | `STATION_NAMES` から駅名を引く。見つからない場合は `id` をそのまま返す。 |
| `GENRES` | `export const` (array) | ジャンル一覧（家系・二郎系・醤油・味噌・塩・つけ麺・その他）。路線図とは別データだが同ファイルに定義。 |

## src/components/LineMap.jsx

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `R` | `const` (number, モジュール内限定) | 駅の丸の半径。`20`。 |
| `buildSegments(line)` | `function` (モジュール内限定) | 隣り合う駅を結ぶ線分の座標(`points`)を配列で生成。`from.corner` があればそこで折り曲げて斜め線を避ける。`line.loop` が `true` なら最後の駅と最初の駅を結ぶ線分も追加。戻り値は `{ key, points }[]`。 |
| `labelAttrs(st)` | `function` (モジュール内限定) | 駅名ラベルの位置を `st.label`(`"top"` / `"bottom"` / `"left"` / `"right"`）に応じて計算し、`{ x, y, textAnchor }` を返す。丸に重ならないよう半径 `R` 分オフセットする。 |
| `LineMap({ line, counts, selectedId, onSelect })` | `export default function` (React コンポーネント) | 路線図本体。`buildSegments` で線分を作り、SVG を「線 → 丸 → 文字」の順で描画（SVGは後勝ちで重なるため）。駅の丸をクリック／Enter・Spaceキーで選択でき、`onSelect(st.id)` を呼ぶ。`counts[st.id]` を丸の中央に表示。 |

## 補足

- SVG座標系は左上が原点、Y軸は下方向が正（数学のグラフと上下逆）。
- 駅の `id` は路線をまたいで共通のIDを使う設計（例: 渋谷・新宿は複数路線に登場するが同じ `id`）。これにより投稿件数（`counts`）を路線間で共有できる。
