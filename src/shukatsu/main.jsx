import React from "react";
import ReactDOM from "react-dom/client";
import ScheduleApp from "./ScheduleApp";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ScheduleApp />
  </React.StrictMode>
);

// サービスワーカーを登録すると、ホーム画面に追加したときに
// 電波が無い場所でも開けるようになる（public/shukatsu/sw.js を参照）。
//
// 開発中（npm run dev）は登録しない。キャッシュが効いてしまい、
// コードを直しても画面が変わらない、という分かりにくい状態になるため。
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/shukatsu/sw.js", { scope: "/shukatsu/" });
      await navigator.serviceWorker.ready;

      // 初回はこのページのJS・CSSがキャッシュに入らないままなので、
      // 何を読み込んだかを数え上げてサービスワーカーに渡す。
      // performance.getEntriesByType("resource") は、この画面が
      // 実際に読み込んだファイルの一覧を返すブラウザ標準の機能。
      const urls = performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((url) => url.startsWith(location.origin));

      navigator.serviceWorker.controller?.postMessage({ type: "cache-assets", urls });
    } catch (e) {
      // オフライン対応に失敗しても、オンラインでの利用には影響しない
      console.error("オフライン用の登録に失敗しました", e);
    }
  });
}
