// .env が無いまま起動した時に出す案内。
// 何も出さないと画面が真っ白になり、原因が分からないため。
export default function SetupNotice() {
  return (
    <div className="page">
      <h1 className="title">セットアップが必要です</h1>
      <p className="lead">
        Supabase の接続情報が読み込めませんでした。<code>.env.example</code> をコピーして
        <code>.env</code> を作り、開発サーバーを再起動してください。
      </p>
      <pre className="setup-code">
        {`cp .env.example .env
# .env に Supabase の URL と anon key を書く
npm run dev`}
      </pre>
      <p className="lead">
        値は Supabase の Project Settings → API から取得できます。手順は README を参照してください。
      </p>
    </div>
  );
}
