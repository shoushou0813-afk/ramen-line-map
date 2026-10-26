import { NAME_PX, labelSide, mapUnit, paddedViewBox, stationRadius, topStations } from "../lib/lineMap";

// 路線図の描画。
// 描く順番が大事で、線 → 丸 → 文字 の順に書かないと線が丸の上に乗ってしまう
// （SVG は後に書いたものが手前に来る）。
// 大きさはすべて「スマホで見たときの px」× unit で viewBox の座標に直して使う（lib/lineMap.js を参照）

const LINE_WIDTH = 5; // 線の太さ（px）
const LINE_EDGE_WIDTH = 8; // 線の下に敷く縁の太さ（px）。黄色など背景に溶ける色でも線が見えるようにする
const HIT_RADIUS = 22; // 指で押せる範囲の半径（px）。小さな点の駅でも押しやすくする

// 隣り合う駅を結ぶ線の座標を作る。
// corner が指定されていたら、そこで一度折り曲げる（斜め線を出したくないため）
function buildSegments(line) {
  const segments = [];
  const list = line.stations;

  for (let i = 0; i < list.length - 1; i++) {
    const from = list[i];
    const to = list[i + 1];
    const points = from.corner
      ? `${from.x},${from.y} ${from.corner[0]},${from.corner[1]} ${to.x},${to.y}`
      : `${from.x},${from.y} ${to.x},${to.y}`;
    segments.push({ key: `${from.id}-${to.id}`, points });
  }

  // 環状線は最後の駅と最初の駅も結ぶ
  if (line.loop) {
    const from = list[list.length - 1];
    const to = list[0];
    segments.push({ key: `${from.id}-${to.id}-loop`, points: `${from.x},${from.y} ${to.x},${to.y}` });
  }

  return segments;
}

// 駅名の位置。r は丸の半径、unit は 1px にあたる viewBox 上の長さ
function labelAttrs(st, side, r, unit) {
  const gap = 6 * unit;
  switch (side) {
    case "bottom":
      return { x: st.x, y: st.y + r + 15 * unit, textAnchor: "middle" };
    case "right":
      return { x: st.x + r + gap, y: st.y + 4 * unit, textAnchor: "start" };
    case "left":
      return { x: st.x - r - gap, y: st.y + 4 * unit, textAnchor: "end" };
    case "top":
    default:
      return { x: st.x, y: st.y - r - gap, textAnchor: "middle" };
  }
}

export default function LineMap({ line, counts, selectedId, onSelect }) {
  const segments = buildSegments(line);
  const unit = mapUnit(line.viewBox);
  const ranking = topStations(line, counts);

  return (
    <>
      <div className="map-frame">
        {/* role="img" にすると中の駅のボタンが読み上げソフトから見えなくなるので、group にしている */}
        <svg viewBox={paddedViewBox(line.viewBox)} className="map-svg" role="group" aria-label={`${line.name}の路線図`}>
          {segments.map((seg) => (
            <polyline key={`${seg.key}-edge`} points={seg.points} className="map-line-edge" strokeWidth={LINE_EDGE_WIDTH * unit} />
          ))}
          {segments.map((seg) => (
            <polyline key={seg.key} points={seg.points} className="map-line" stroke={line.color} strokeWidth={LINE_WIDTH * unit} />
          ))}

          {line.stations.map((st, index) => {
            const count = counts[st.id] ?? 0;
            const selected = st.id === selectedId;
            const empty = count === 0;
            const r = stationRadius(count, selected) * unit;
            const label = labelAttrs(st, labelSide(line, index), r, unit);
            return (
              <g
                key={st.id}
                className="map-station"
                onClick={() => onSelect(st.id)}
                tabIndex={0}
                role="button"
                aria-label={`${st.name}駅 記録${count}件`}
                aria-pressed={selected}
                // キーボードでも選べるようにしておく
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(st.id);
                  }
                }}
              >
                <circle cx={st.x} cy={st.y} r={HIT_RADIUS * unit} className="map-hit" strokeWidth={2 * unit} />
                {selected && <circle cx={st.x} cy={st.y} r={r + 5 * unit} className="map-halo" strokeWidth={3 * unit} />}
                <circle
                  cx={st.x}
                  cy={st.y}
                  r={r}
                  strokeWidth={(empty ? 2 : 2.5) * unit}
                  className={["map-circle", empty && "is-empty", selected && "is-selected"].filter(Boolean).join(" ")}
                />
                {/* 記録がない駅は数字を出さない（選んでいる駅だけは 0 と出す） */}
                {(!empty || selected) && (
                  <text
                    x={st.x}
                    y={st.y}
                    dy="0.36em"
                    textAnchor="middle"
                    fontSize={NAME_PX * unit}
                    className={selected ? "map-count is-selected" : "map-count"}
                  >
                    {count}
                  </text>
                )}
                <text {...label} fontSize={NAME_PX * unit} className={empty ? "map-name is-empty" : "map-name"}>
                  {st.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="map-hint">駅の丸をタップすると、下にその駅の記録が出ます</p>

      <div className="map-legend">
        <span className="map-legend-item">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <circle cx="9" cy="9" r="7.5" className="map-circle" strokeWidth="2" />
          </svg>
          数字は記録の数
        </span>
        <span className="map-legend-item">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <circle cx="6" cy="6" r="4" className="map-circle is-empty" strokeWidth="2" />
          </svg>
          まだ記録なし
        </span>
      </div>

      {/* 路線図が見づらい人・読み上げソフトを使う人向けに、ふつうの選択欄でも駅を選べるようにする */}
      <label className="map-select">
        一覧から駅を選ぶ
        <select className="input" value={selectedId} onChange={(e) => onSelect(e.target.value)}>
          {!line.stations.some((st) => st.id === selectedId) && <option value={selectedId}>選んでください</option>}
          {line.stations.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}（記録{counts[st.id] ?? 0}件）
            </option>
          ))}
        </select>
      </label>

      {ranking.length > 0 && (
        <div className="map-ranking">
          <div className="map-ranking-title">記録が多い駅</div>
          <div className="map-ranking-list">
            {ranking.map((st) => (
              <button
                key={st.id}
                className={st.id === selectedId ? "map-ranking-chip is-active" : "map-ranking-chip"}
                onClick={() => onSelect(st.id)}
              >
                {st.name} <b>{st.count}</b>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
