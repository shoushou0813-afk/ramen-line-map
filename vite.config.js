import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// __dirname は ESM（import/export を使う書き方）では使えないので、
// このファイル自身のURLからディレクトリのパスを組み立てている。
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    // 1つのプロジェクトに2つのページを持たせる「マルチページ構成」。
    // ここに書いたHTMLがそれぞれ独立した入口になり、
    // /（ラーメン路線図）と /shukatsu.html（就活タイムテーブル）で開ける。
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        shukatsu: resolve(root, "shukatsu.html"),
      },
    },
  },
});
