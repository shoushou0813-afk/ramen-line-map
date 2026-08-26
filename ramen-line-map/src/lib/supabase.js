import { createClient } from "@supabase/supabase-js";

// Vite では VITE_ で始まる環境変数だけがブラウザ側に渡される
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// .env を作り忘れた時に画面が真っ白になって原因が分からなくなるので、
// ここで気づけるようにしておく
if (!url || !anonKey) {
  console.error(
    ".env の VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が設定されていません。" +
      ".env.example をコピーして .env を作ってください。"
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");
