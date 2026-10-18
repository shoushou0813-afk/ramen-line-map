import { useEffect, useState } from "react";

// ここまでスクロールしたらボタンを出す（px）。画面1枚分くらい下がってから出せば邪魔にならない
const SHOW_AFTER = 400;

// 画面の右下に出る「一番上に戻る」ボタン
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (!visible) return null;

  return (
    <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="一番上に戻る">
      ↑
    </button>
  );
}
