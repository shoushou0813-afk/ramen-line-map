// サービスワーカー（Service Worker）。
//
// ブラウザがページとは別に裏で動かす小さなプログラムで、
// ページが出す通信をいったん横取りできる。これがあると、
// 電波が無い場所でもキャッシュから画面を出せる＝オフラインで開ける。
//
// このファイルは Vite の変換を通さない public/ に置いているので、
// ビルドしてもそのままの内容で配信される。
// 置き場所が /shukatsu/ なので、効く範囲（スコープ）も /shukatsu/ 以下に限られる。
// ラーメン路線図側（/）には影響しない。

const VERSION = "v1";
const CACHE = `shukatsu-${VERSION}`;

// 最低限これだけあれば画面が出る、という一式
const SHELL = [
  "/shukatsu/",
  "/shukatsu/manifest.webmanifest",
  "/shukatsu/icon-192.png",
  "/shukatsu/icon-512.png",
];

self.addEventListener("install", (event) => {
  // waitUntil に Promise を渡すと、その処理が終わるまで次の段階に進まない
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL))
  );
  // 新しいサービスワーカーを待たせずすぐ有効にする
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 古いバージョンのキャッシュを消す（VERSION を上げたときの掃除）
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("shukatsu-") && k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ページからの依頼で、JS・CSSなどをキャッシュに入れておく。
//
// 初回にページを開いた時点ではサービスワーカーがまだ通信を横取りできておらず、
// JS・CSSがキャッシュに入らない。そのまま電波の無い場所に行くと、
// 画面の骨組みだけあって中身が動かない状態になる。
// そこでページ側から「今読み込んだファイル一覧」を送ってもらい、ここで入れておく。
self.addEventListener("message", (event) => {
  const { type, urls } = event.data ?? {};
  if (type !== "cache-assets" || !Array.isArray(urls)) return;

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll は1つでも失敗すると全部やり直しになるので、1件ずつ入れる。
      // allSettled は成功・失敗にかかわらず全部の完了を待つ書き方。
      await Promise.allSettled(urls.map((url) => cache.add(url)));
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 書き込み系（POSTなど）や外部サイトへの通信には触らない
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // ページそのもの（アドレスバーからの移動）は「通信優先」。
  // 新しいビルドをすぐ反映したいので、まずネットワークを試し、
  // つながらないときだけキャッシュを返す。
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          // Response は一度読むと使えなくなるので、複製をキャッシュに入れる
          cache.put("/shukatsu/", fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match("/shukatsu/");
          return cached ?? Response.error();
        }
      })()
    );
    return;
  }

  // JS・CSS・画像は「キャッシュ優先」。
  // Vite がファイル名にハッシュを付けるので、中身が変われば別のファイル名になる。
  // つまり古い内容を返し続ける心配がなく、2回目以降は通信ゼロで開ける。
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        return Response.error();
      }
    })()
  );
});
