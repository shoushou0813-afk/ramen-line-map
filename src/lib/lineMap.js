// 路線図の見た目の計算。描画（LineMap.jsx）から切り離してテストできるようにしている。
//
// 路線図の SVG は viewBox の座標で描くので、そのままだと路線ごとに文字や丸の大きさが変わる
// （総武線は横 680 を約 340px に縮めるので、14 で書いた駅名が 7px になっていた）。
// そこで大きさは「スマホで見たときの px」で決め、mapUnit を掛けて viewBox の座標に直す。

// スマホで見たときの路線図の幅（px）。カードの余白を引いた、だいたいの幅
export const PHONE_MAP_WIDTH = 340;

// 路線図のまわりに足す余白（px）。端の駅の駅名や大きい丸がはみ出さないようにする
export const MAP_PADDING = 8;

// 駅名と件数の文字の大きさ（px）。駅の間隔が一番狭い総武線（約 50px）で隣の駅名と重ならない最大の大きさ
export const NAME_PX = 13;

// 記録が多い駅のボタンをいくつまで出すか
export const TOP_STATIONS_LIMIT = 6;

function viewBoxWidth(viewBox) {
  return Number(viewBox.split(" ")[2]);
}

/** スマホで 1px にあたる viewBox 上の長さ。大きさ(px) × mapUnit で viewBox の座標になる */
export function mapUnit(viewBox) {
  return viewBoxWidth(viewBox) / (PHONE_MAP_WIDTH - MAP_PADDING * 2);
}

/** viewBox の上下左右に MAP_PADDING 分の余白を足したものを返す */
export function paddedViewBox(viewBox) {
  const [x, y, w, h] = viewBox.split(" ").map(Number);
  const pad = MAP_PADDING * mapUnit(viewBox);
  return `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`;
}

/**
 * 駅の丸の半径（px）。記録がない駅は小さな点にして、記録がある駅は件数が多いほど大きくする。
 * 選んでいる駅は、記録がなくても数字が入る大きさにする
 */
export function stationRadius(count, selected = false) {
  if (count === 0 && !selected) return 5;
  return Math.min(16, 9 + 1.5 * Math.max(count, 1));
}

// from から to へ向かう向き。縦横どちらに大きく動くかで決める
function direction(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dy) > Math.abs(dx)) return dy < 0 ? "up" : "down";
  return dx < 0 ? "left" : "right";
}

// その駅から線が出ている向きを集める。曲がる点（corner）がある区間は、駅から曲がる点へ向かう向きで考える。
// 環状線の最後と最初を結ぶ線は buildSegments と同じく corner を使わない
function lineDirections(line, index) {
  const list = line.stations;
  const st = list[index];
  const dirs = new Set();

  if (index < list.length - 1) {
    const to = st.corner ? { x: st.corner[0], y: st.corner[1] } : list[index + 1];
    dirs.add(direction(st, to));
  } else if (line.loop) {
    dirs.add(direction(st, list[0]));
  }

  if (index > 0) {
    const prev = list[index - 1];
    const from = prev.corner ? { x: prev.corner[0], y: prev.corner[1] } : prev;
    dirs.add(direction(st, from));
  } else if (line.loop) {
    dirs.add(direction(st, list[list.length - 1]));
  }

  return dirs;
}

/**
 * 駅名を丸のどちら側に置くか。基本は上にそろえ、上に線が出ている駅（線が上から下りてくる角の駅など）は下にする。
 * 上下どちらにも線が通っている駅は横に置き、図の外側（近い方の端）に向ける
 */
export function labelSide(line, index) {
  const dirs = lineDirections(line, index);
  if (!dirs.has("up")) return "top";
  if (!dirs.has("down")) return "bottom";
  return line.stations[index].x > viewBoxWidth(line.viewBox) / 2 ? "right" : "left";
}

/** この路線で記録が多い駅を、多い順に limit 件返す。同じ件数なら路線の並び順 */
export function topStations(line, counts, limit = TOP_STATIONS_LIMIT) {
  return line.stations
    .map((st, index) => ({ ...st, count: counts[st.id] ?? 0, index }))
    .filter((st) => st.count > 0)
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .slice(0, limit);
}
