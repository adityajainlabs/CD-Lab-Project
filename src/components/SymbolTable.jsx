export default function SymbolTable({ rows = [] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 px-4 py-8 text-center text-sm text-slate-400">
        Symbol table is empty. Declare a variable to see it appear here.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Kind</th>
              <th className="px-4 py-3 font-medium">Scope</th>
              <th className="px-4 py-3 font-medium">Line</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-[#0e1624]">
            {rows.map((row, index) => (
              <tr key={`${row.name}-${row.line}-${index}`} className="hover:bg-slate-800/40">
                <td className="px-4 py-2.5 font-mono text-sky-200">{row.name}</td>
                <td className="px-4 py-2.5 font-mono text-amber-200">{row.type}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.kind}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.scope}</td>
                <td className="px-4 py-2.5 font-mono text-slate-300">{row.line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
