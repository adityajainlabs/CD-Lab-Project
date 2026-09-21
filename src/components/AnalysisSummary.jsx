export default function AnalysisSummary({ summary }) {
  if (!summary) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-[#0e1624]/60 px-4 py-5 text-sm text-slate-400">
        Click Analyze to run the compiler pipeline on the editor contents.
      </div>
    );
  }

  if (summary.passed) {
    return (
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-5">
        <p className="text-base font-semibold text-emerald-300">✓ No errors found</p>
        <p className="mt-1 text-sm text-slate-300">
          Code passed lexical, syntax and semantic analysis.
        </p>
        <p className="mt-3 font-mono text-xs text-slate-400">
          Tokens: {summary.tokenCount}
          {summary.warningCount > 0 ? ` · Warnings: ${summary.warningCount}` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e1624] px-4 py-5">
      <p className="text-base font-semibold text-white">Analysis Complete</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="Tokens" value={summary.tokenCount} />
        <Stat label="Errors" value={summary.errorCount} accent="text-rose-300" />
        <Stat label="Warnings" value={summary.warningCount} accent="text-amber-300" />
        <Stat label="Passed" value="No" accent="text-rose-300" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Chip label="Lexical Errors" value={summary.lexicalErrors} color="orange" />
        <Chip label="Syntax Errors" value={summary.syntaxErrors} color="rose" />
        <Chip label="Semantic Errors" value={summary.semanticErrors} color="violet" />
      </div>
    </div>
  );
}

function Stat({ label, value, accent = 'text-slate-100' }) {
  return (
    <div className="rounded-lg bg-slate-900/70 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 font-mono text-lg ${accent}`}>{value}</p>
    </div>
  );
}

function Chip({ label, value, color }) {
  const colors = {
    orange: 'bg-orange-500/10 text-orange-300 ring-orange-400/20',
    rose: 'bg-rose-500/10 text-rose-300 ring-rose-400/20',
    violet: 'bg-violet-500/10 text-violet-300 ring-violet-400/20',
  };
  return (
    <span className={`rounded-full px-3 py-1 ring-1 ${colors[color]}`}>
      {label}: {value}
    </span>
  );
}
