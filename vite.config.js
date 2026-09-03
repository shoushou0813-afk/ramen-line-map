import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // テストは Supabase に接続しない（純粋関数だけを対象にしている）が、
    // クライアントの生成時に URL の形式が検証されるのでダミー値を入れておく
    env: {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
});
