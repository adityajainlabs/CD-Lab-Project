const TYPE_STYLES = {
  Lexical: 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/30',
  Syntax: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30',
  Semantic: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30',
  Warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30',
};

export default function ErrorPanel({ errors = [], warnings = [], onSelect }) {
  const rows = [...errors, ...warnings];

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-8 text-center">
        <p className="text-sm font-medium text-emerald-300">No errors or warnings</p>
        <p className="mt-1 text-xs text-slate-400">The current program passed this analysis phase.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Line</th>
              <th className="px-4 py-3 font-medium">Column</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Expected</th>
              <th className="px-4 py-3 font-medium">Actual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-[#0e1624]">
            {rows.map((item, index) => (
              <tr
                key={`${item.type}-${item.line}-${item.column}-${index}`}
                className="cursor-pointer transition hover:bg-slate-800/60"
                onClick={() => onSelect?.(item)}
              >
                <td className="px-4 py-3 font-mono text-slate-200">{item.line}</td>
                <td className="px-4 py-3 font-mono text-slate-200">{item.column}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[item.type] ?? TYPE_STYLES.Syntax}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-200">{item.message}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{item.expected ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{item.actual ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-800 px-4 py-2 text-xs text-slate-500">
        Click a row to jump to that location in the editor.
      </p>
    </div>
  );
}
