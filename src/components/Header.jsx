export default function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-[#070b12]/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-400">
            Compiler Design Lab
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Code Syntax &amp; Error Detector
          </h1>
        </div>
        <p className="max-w-md text-sm text-slate-400">
          Source → Lexer → Tokens → Parser → AST → Semantic Analysis → Errors
        </p>
      </div>
    </header>
  );
}
