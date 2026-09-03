import { createClient } from "@supabase/supabase-js";

// Vite では VITE_ で始まる環境変数だけがブラウザ側に渡される
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// .env を作り忘れているかどうか。main.jsx でセットアップ手順を出すのに使う
export const isConfigured = Boolean(url && anonKey);

if (!isConfigured) {
  console.error(
    ".env の VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません。" +
      ".env.example をコピーして .env を作ってください。"
  );
}

// createClient は空文字を渡すと例外を投げ、画面が真っ白になる。
// 未設定に気づけないと原因を追いにくいので、ここではダミー値で通しておき、
// 案内は main.jsx が画面に出す。
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key"
);
