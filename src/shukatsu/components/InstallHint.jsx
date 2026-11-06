import { useState } from "react";

const DISMISS_KEY = "shukatsu-timetable/install-hint-dismissed";

/**
 * 「ホーム画面に追加」の案内。
 *
 * すでにアプリとして起動している場合は出さない。
 * display-mode: standalone は「ブラウザのタブではなく単独の画面で開かれているか」を
 * 判定する仕組みで、ホーム画面のアイコンから起動したときに真になる。
 */
function isInstalled() {
  try {
    return (
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true // iOS Safari 用
    );
  } catch {
    return false;
  }
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export default function InstallHint() {
  const [hidden, setHidden] = useState(() => isInstalled() || wasDismissed());
  if (hidden) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // 保存できなくても閉じるだけはできるようにする
    }
    setHidden(true);
  }

  return (
    <div className="install-hint">
      <div className="install-hint-body">
        <strong>アプリとして使えます</strong>
        <p>
          スマホのブラウザで共有ボタン（iPhone）またはメニュー（Android）を開き、
          <b>「ホーム画面に追加」</b>を選ぶと、アイコンから起動できて電波が無くても開けます。
        </p>
      </div>
      <button className="install-hint-close" onClick={dismiss} aria-label="閉じる">
        ✕
      </button>
    </div>
  );
}
