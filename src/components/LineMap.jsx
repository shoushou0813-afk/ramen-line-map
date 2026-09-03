// 路線図の描画。
// 描く順番が大事で、線 → 丸 → 文字 の順に書かないと線が丸の上に乗ってしまう
// （SVG は後に書いたものが手前に来る）。

export const R = 20; // 駅の丸の半径

// 隣り合う駅を結ぶ線の座標を作る。
// corner が指定されていたら、そこで一度折り曲げる（斜め線を出したくないため）
export function buildSegments(line) {
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

// 駅名をどこに置くか。丸に重ならない位置にずらす
export function labelAttrs(st) {
  switch (st.label) {
    case "bottom":
      return { x: st.x, y: st.y + R + 20, textAnchor: "middle" };
    case "right":
      return { x: st.x + R + 12, y: st.y + 5, textAnchor: "start" };
    case "left":
      return { x: st.x - R - 12, y: st.y + 5, textAnchor: "end" };
    case "top":
    default:
      return { x: st.x, y: st.y - R - 10, textAnchor: "middle" };
  }
}

export default function LineMap({ line, counts, selectedId, onSelect }) {
  const segments = buildSegments(line);

  return (
    <div className="map-frame">
      <svg viewBox={line.viewBox} className="map-svg" role="img" aria-label={`${line.name}の路線図`}>
        {segments.map((seg) => (
          <polyline key={seg.key} points={seg.points} className="map-line" />
        ))}

        {line.stations.map((st) => {
          const selected = st.id === selectedId;
          const label = labelAttrs(st);
          return (
            <g
              key={st.id}
              className="map-station"
              onClick={() => onSelect(st.id)}
              tabIndex={0}
              role="button"
              aria-label={`${st.name}駅`}
              // キーボードでも選べるようにしておく
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(st.id);
                }
              }}
            >
              <circle
                cx={st.x}
                cy={st.y}
                r={R}
                className={selected ? "map-circle is-selected" : "map-circle"}
              />
              <text
                x={st.x}
                y={st.y}
                dy="0.36em"
                textAnchor="middle"
                className={selected ? "map-count is-selected" : "map-count"}
              >
                {counts[st.id] ?? 0}
              </text>
              <text {...label} className="map-name">
                {st.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
