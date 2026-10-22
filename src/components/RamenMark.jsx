// 名前の横に出すラーメンのマーク。一番多く投稿している種類によって、スープの色と上にのせる絵が変わる。
// 味噌・醤油・塩は具ではなく、その調味料そのもの（味噌のかたまり・醤油さし・塩の瓶）を描いている。
// 丼とスープは共通で、種類ごとの具だけを差し替えている。
// 具はその種類の投稿数で決まる段階 stage（0〜4、rank.js の toppingStage）で増えていく。段階が上がると前の段階の具も引き継ぐ。

const SOUP_COLORS = {
  家系: "#c98a3e",
  二郎系: "#a5672f",
  醤油: "#7a3b12",
  味噌: "#d9923a",
  塩: "#f1dc9a",
  つけ麺: "#5a2e10",
  その他: "#e3b85c", // 油そばの麺の色
};

// 塩の最終段階（黄金スープ）だけスープの色が変わる
const GOLDEN_SOUP = "#f5c33b";

// 小さなきらめき（4つの角がある星）
function Sparkle({ x, y, r = 1 }) {
  return (
    <path
      d={`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`}
      fill="#fffbe6"
    />
  );
}

// 家系：海苔とほうれん草 → 海苔マシ → ほうれん草マシ → ライス付き → 海苔タワー
function iekeiToppings(stage) {
  const nori =
    stage >= 4
      ? [-50, -36, -22, -8, 8, 22, 36, 50].map((angle) => ({ x: 14, width: 2.4, height: 8, angle }))
      : stage >= 1
        ? [
            { x: 11.4, width: 2.6, height: 7, angle: 0 },
            { x: 14, width: 2.6, height: 8.5, angle: 0 },
            { x: 16.6, width: 2.6, height: 8, angle: 0 },
            { x: 19.2, width: 2.6, height: 6.5, angle: 0 },
          ]
        : [
            { x: 14, width: 3.2, height: 8.5, angle: 0 },
            { x: 17.6, width: 3.2, height: 7.5, angle: 0 },
          ];
  return (
    <>
      {stage >= 3 && (
        <>
          <path d="M0.8 6 H6.2 L5.4 8.4 H1.6 Z" fill="#5b7fb5" />
          <path d="M0.8 6 Q3.5 2.4 6.2 6 Z" fill="#fff" stroke="#ddd" strokeWidth="0.3" />
        </>
      )}
      {nori.map(({ x, width, height, angle }, i) => (
        <rect
          key={i}
          x={x}
          y={11 - height}
          width={width}
          height={height}
          fill={i % 2 ? "#2b4d31" : "#1f3a24"}
          transform={angle ? `rotate(${angle} ${x + width / 2} 11)` : undefined}
        />
      ))}
      {stage >= 2 ? (
        <>
          <ellipse cx="6" cy="10.2" rx="2.6" ry="1.5" fill="#2f6b2a" />
          <ellipse cx="8.6" cy="9.4" rx="2.4" ry="1.6" fill="#3f8a36" />
          <ellipse cx="7" cy="8.4" rx="2" ry="1.3" fill="#2f6b2a" />
          <path d="M4.5 10 L10 9.2 M5.5 8.6 L9 8.2" stroke="#6fb05e" strokeWidth="0.4" />
        </>
      ) : (
        <>
          <ellipse cx="7.5" cy="10.3" rx="2.2" ry="1.2" fill="#2f6b2a" />
          <ellipse cx="9.8" cy="9.8" rx="1.8" ry="1.1" fill="#3f8a36" />
          <path d="M6.5 10 L10.5 9.6" stroke="#6fb05e" strokeWidth="0.4" />
        </>
      )}
    </>
  );
}

// 背脂の粒。盛りの段階ごとに、野菜の山からはみ出さない位置に置く
const FAT_SPOTS = {
  few: [
    [11.6, 7],
    [13.2, 8.2],
  ],
  many: [
    [11, 5],
    [13, 5.6],
    [10, 7],
    [12.2, 7.2],
    [14.2, 8.4],
    [9, 8.6],
  ],
  tower: [
    [12, 2.6],
    [11, 4],
    [13, 4.6],
    [10, 6.4],
    [12.2, 6.8],
    [14.2, 7.8],
    [8.6, 8.6],
    [15.6, 9.4],
  ],
};

// 二郎系：普通 → 野菜マシ → 背脂マシ → 豚マシ → 全マシマシ
function jiroToppings(stage) {
  const mound = stage >= 4 ? "M4.5 11 Q12 -9 19.5 11 Z" : stage >= 1 ? "M5.5 11 Q12 -3 18.5 11 Z" : "M7 11 Q12 1 17 11 Z";
  const fat = stage >= 4 ? FAT_SPOTS.tower : stage >= 2 ? FAT_SPOTS.many : FAT_SPOTS.few;
  return (
    <>
      <rect x="2.6" y="5.4" width="4.6" height="5.6" rx="1" fill="#8b4a22" stroke="#c98a5a" strokeWidth="0.6" transform="rotate(-15 4.9 8.2)" />
      {stage >= 3 && (
        <rect x="16.8" y="5.4" width="4.6" height="5.6" rx="1" fill="#8b4a22" stroke="#c98a5a" strokeWidth="0.6" transform="rotate(15 19.1 8.2)" />
      )}
      <path d={mound} fill="#e6efcf" stroke="#9cbb63" strokeWidth="0.8" />
      {fat.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.8" fill="#fffdf5" stroke="#d9d2bd" strokeWidth="0.3" />
      ))}
      {stage >= 3 ? (
        <ellipse cx="12" cy="11.2" rx={stage >= 4 ? 3 : 2} ry={stage >= 4 ? 1.3 : 0.9} fill="#f3e3a4" />
      ) : (
        <path d="M17 11 Q19 8.4 21 11 Z" fill="#f3e3a4" />
      )}
    </>
  );
}

// 醤油：醤油さし → なると → メンマ → チャーシュー → 特製（金の醤油さし）
function shoyuToppings(stage) {
  const gold = stage >= 4;
  return (
    <>
      {stage >= 3 && <ellipse cx="9.6" cy="9.6" rx="2.8" ry="1.7" fill="#b5764a" stroke="#e0b089" strokeWidth="0.5" />}
      {stage >= 1 && (
        <>
          <circle cx="5.8" cy="10.4" r="1.9" fill="#fff" stroke="#e05587" strokeWidth="0.7" />
          <path d="M5.8 10.4 m-0.9 0 a0.9 0.9 0 1 1 0.9 0.9" fill="none" stroke="#e05587" strokeWidth="0.5" />
        </>
      )}
      {stage >= 2 && (
        <>
          <rect x="11.6" y="9.4" width="2.6" height="0.9" rx="0.3" fill="#c99a4b" transform="rotate(-20 12.9 9.85)" />
          <rect x="11.8" y="10.6" width="2.6" height="0.9" rx="0.3" fill="#b8873a" transform="rotate(10 13.1 11.05)" />
        </>
      )}
      <rect x="15" y="4" width="5" height="7.5" rx="1.3" fill={gold ? "#c9a227" : "#2e1606"} />
      <rect x="15.6" y="6.6" width="3.8" height="2" fill="#fff" />
      <rect x="15.8" y="1.6" width="3.4" height="2.8" rx="0.7" fill={gold ? "#f2d16b" : "#d7262e"} />
      <path d="M15.8 2.4 L14 1.8" stroke={gold ? "#f2d16b" : "#d7262e"} strokeWidth="0.9" strokeLinecap="round" />
      {gold && (
        <>
          <Sparkle x={21.6} y={3} r={1.2} />
          <Sparkle x={13.2} y={5} r={0.8} />
        </>
      )}
    </>
  );
}

// 味噌：味噌のかたまり → コーン → コーンバター → もやしマシ → 北海道スペシャル（大きい味噌とカニの足）
function misoToppings(stage) {
  const big = stage >= 4;
  return (
    <>
      {stage >= 3 && <path d="M4.5 11 Q12 0 19.5 11 Z" fill="#f5f1e0" stroke="#d8d0b0" strokeWidth="0.6" />}
      {big ? (
        <path d="M7 11 Q6.5 4.5 12 4.3 Q17.5 4.5 17 11 Z" fill="#b8692a" />
      ) : (
        <path d="M8.5 11 Q8.2 7 12 6.9 Q15.8 7 15.5 11 Z" fill="#b8692a" />
      )}
      <path
        d={big ? "M8.6 7.6 Q12 6.4 15.4 7.6 M8.2 9.4 Q12 8.2 15.8 9.4" : "M9.8 8.8 Q12 8 14.2 8.8 M9.4 10.2 Q12 9.4 14.6 10.2"}
        fill="none"
        stroke="#8a4a17"
        strokeWidth="0.6"
      />
      {stage >= 2 && (
        <rect
          x="10.8"
          y={big ? 3 : 5.6}
          width="2.4"
          height="2"
          rx="0.3"
          fill="#fff3a8"
          stroke="#e8d36a"
          strokeWidth="0.4"
          transform={`rotate(-12 12 ${big ? 4 : 6.6})`}
        />
      )}
      {stage >= 1 &&
        [
          [4.4, 10.4],
          [5.8, 11.4],
          [17.8, 11.2],
          [19.4, 10.4],
          [18.6, 12],
        ].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.8" fill="#f6cf2b" />)}
      {big && (
        <>
          <path d="M15.5 4.5 L21.5 9.5" stroke="#e8562a" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M17.2 5.9 L17.9 5.1 M19.2 7.6 L19.9 6.8" stroke="#fff" strokeWidth="0.5" />
          <circle cx="21.5" cy="9.5" r="0.7" fill="#fff" />
        </>
      )}
    </>
  );
}

// 塩：塩の瓶 → レモン → 白髪ねぎ → 鶏チャーシュー → 黄金スープ（スープが金色に光る）
function shioToppings(stage) {
  return (
    <>
      {stage >= 1 && (
        <>
          <circle cx="6.6" cy="10" r="2.1" fill="#fff59d" stroke="#f2c94c" strokeWidth="0.6" />
          <path d="M6.6 8.2 V11.8 M4.9 10 H8.3 M5.4 8.8 L7.8 11.2 M7.8 8.8 L5.4 11.2" stroke="#f2c94c" strokeWidth="0.3" />
        </>
      )}
      {stage >= 3 && <ellipse cx="11.2" cy="10.2" rx="2.5" ry="1.3" fill="#f2d5c4" stroke="#d9a98e" strokeWidth="0.5" />}
      {stage >= 2 && (
        <path
          d="M9.4 9.2 Q11 8 12.6 9.4 M9.8 8.6 Q11.6 9.8 13 8.4 M10.2 9.8 Q11.4 7.8 12.8 9"
          fill="none"
          stroke="#e9f3d0"
          strokeWidth="0.5"
        />
      )}
      <rect x="14.5" y="4.2" width="5.5" height="7" rx="1.5" fill="#fff" stroke="#b9b9b9" strokeWidth="0.6" />
      <rect x="14.5" y="1.8" width="5.5" height="2.8" rx="1" fill="#8f99a3" />
      <circle cx="16" cy="3.2" r="0.4" fill="#fff" />
      <circle cx="17.25" cy="3.2" r="0.4" fill="#fff" />
      <circle cx="18.5" cy="3.2" r="0.4" fill="#fff" />
      {stage < 1 && (
        <>
          <rect x="7" y="9.8" width="0.9" height="0.9" fill="#fff" />
          <rect x="9.2" y="10.6" width="0.9" height="0.9" fill="#fff" />
          <rect x="11" y="9.6" width="0.9" height="0.9" fill="#fff" />
        </>
      )}
      {stage >= 4 && (
        <>
          <Sparkle x={4} y={11.6} r={0.9} />
          <Sparkle x={13.6} y={12.2} r={0.8} />
          <Sparkle x={21.4} y={6} r={1.2} />
        </>
      )}
    </>
  );
}

// つけ麺：箸で持ち上げた麺 → 麺大盛り → 魚粉 → 味玉 → 特盛（麺があふれる）
function tsukemenToppings(stage) {
  const noodles =
    stage >= 1
      ? "M9.6 4 Q8.6 7 10.6 10 M10.8 3.8 Q9.8 7 11.8 10 M12 4 Q11 7 13 10 M13.2 4.2 Q12.2 7 14.2 10 M14.2 4.6 Q13.4 7.4 15 10"
      : "M10 4 Q9 7 11 10 M11.5 4 Q10.5 7 12.5 10 M13 4.3 Q12 7 14 10";
  return (
    <>
      {stage >= 4 && (
        <>
          <path d="M3.5 11 Q12 -3 20.5 11 Z" fill="#f3d88a" stroke="#d9b45a" strokeWidth="0.6" />
          <path
            d="M5.5 10 Q8 7 10 9 T14 8 T18.5 10 M7 7.5 Q9.5 5 12 7 T16.5 6.6 M9 5 Q11 3 13.5 4.6"
            fill="none"
            stroke="#d9b45a"
            strokeWidth="0.5"
          />
        </>
      )}
      {stage >= 2 &&
        [
          [4.4, 10.6],
          [5.4, 11.6],
          [6.4, 10.4],
          [5, 9.8],
          [7.2, 11.4],
        ].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.45" fill="#a8844f" />)}
      {stage >= 3 && (
        <>
          <ellipse cx="18" cy="10.4" rx="2.6" ry="1.8" fill="#fff" stroke="#e2d2a8" strokeWidth="0.4" />
          <circle cx="18" cy="10.4" r="1.1" fill="#f29a1d" />
        </>
      )}
      <path d="M8 1.5 L13 10" stroke="#8a5a2b" strokeWidth="0.9" />
      <path d="M10 1 L14.5 10" stroke="#8a5a2b" strokeWidth="0.9" />
      <path d={noodles} fill="none" stroke="#f0cd78" strokeWidth={stage >= 1 ? 1.1 : 0.9} />
    </>
  );
}

// その他（油そば）：麺と卵黄 → ねぎ多め → ラー油 → お酢 → 全部のせ（卵黄2つ・チャーシュー・海苔）
function aburaToppings(stage) {
  const negi =
    stage >= 1
      ? [
          [7, 9.4],
          [16.5, 9.8],
          [5, 10.6],
          [10, 11.2],
          [15, 11.4],
          [18.4, 10.6],
          [8.6, 8.8],
        ]
      : [
          [7, 9.4],
          [16.5, 9.8],
        ];
  return (
    <>
      <path d="M4 11 q1.5 -1.6 3 0 t3 0 t3 0 t3 0 t3 0" fill="none" stroke="#b9842a" strokeWidth="0.8" />
      {stage >= 4 && (
        <>
          <rect x="14.6" y="3.4" width="3" height="7.4" fill="#1f3a24" />
          <ellipse cx="6.4" cy="9.6" rx="2.4" ry="1.5" fill="#b5764a" stroke="#e0b089" strokeWidth="0.5" />
        </>
      )}
      {negi.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1.4" height="0.8" fill="#4caf50" />
      ))}
      {stage >= 2 &&
        [
          [5.6, 11.8],
          [8.4, 10.6],
          [12, 12],
          [16.2, 12.2],
          [19.6, 11.4],
        ].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.45" fill="#d32f2f" />)}
      <circle cx={stage >= 4 ? 11 : 13} cy="9.8" r="1.8" fill="#f4a300" stroke="#fff3c4" strokeWidth="0.5" />
      {stage >= 4 && <circle cx="14.4" cy="10.4" r="1.6" fill="#f4a300" stroke="#fff3c4" strokeWidth="0.5" />}
      {stage >= 3 && (
        <>
          <rect x="18.6" y="4.2" width="3" height="6.8" rx="0.9" fill="#f3efe3" stroke="#9a9a9a" strokeWidth="0.4" />
          <rect x="19.2" y="2.6" width="1.8" height="1.8" rx="0.4" fill="#333" />
          <rect x="18.9" y="6.4" width="2.4" height="1.6" fill="#d32f2f" />
        </>
      )}
    </>
  );
}

const TOPPINGS = {
  家系: iekeiToppings,
  二郎系: jiroToppings,
  醤油: shoyuToppings,
  味噌: misoToppings,
  塩: shioToppings,
  つけ麺: tsukemenToppings,
  その他: aburaToppings,
};

export default function RamenMark({ genre, size = 18, stage = 0 }) {
  const soup = genre === "塩" && stage >= 4 ? GOLDEN_SOUP : (SOUP_COLORS[genre] ?? "#eee");
  return (
    <svg className="ramen-mark" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 11 H22 A10 9 0 0 1 2 11 Z" fill="#c23a2b" />
      <path d="M4 15 H20" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.6 1.2" />
      <ellipse cx="12" cy="11" rx="10" ry="2.2" fill={soup} stroke="#9e2b1f" strokeWidth="0.6" />
      {TOPPINGS[genre]?.(stage)}
      <rect x="8" y="19.5" width="8" height="2" rx="1" fill="#9e2b1f" />
    </svg>
  );
}
