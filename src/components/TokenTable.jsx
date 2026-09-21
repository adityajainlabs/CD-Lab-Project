const TYPE_COLORS = {
  KEYWORD: 'text-sky-300',
  IDENTIFIER: 'text-slate-100',
  NUMBER: 'text-amber-300',
  STRING: 'text-emerald-300',
  BOOLEAN: 'text-fuchsia-300',
  ASSIGN: 'text-pink-300',
  OPERATOR: 'text-pink-300',
  SEPARATOR: 'text-slate-300',
  SEMICOLON: 'text-slate-300',
  COMMENT: 'text-slate-500',
  INVALID: 'text-rose-300',
};

export default function TokenTable({ tokens = [] }) {
  if (tokens.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 px-4 py-8 text-center text-sm text-slate-400">
        No tokens yet. Analyze a program to populate the token stream.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Lexeme</th>
              <th className="px-4 py-3 font-medium">Token Type</th>
              <th className="px-4 py-3 font-medium">Line</th>
              <th className="px-4 py-3 font-medium">Column</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-[#0e1624]">
            {tokens.map((token, index) => (
              <tr key={`${token.line}-${token.column}-${index}`} className="hover:bg-slate-800/40">
                <td className={`px-4 py-2.5 font-mono ${TYPE_COLORS[token.type] ?? 'text-slate-200'}`}>
                  {token.lexeme === '' ? '∅' : token.lexeme}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs tracking-wide text-slate-400">{token.type}</td>
                <td className="px-4 py-2.5 font-mono text-slate-300">{token.line}</td>
                <td className="px-4 py-2.5 font-mono text-slate-300">{token.column}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
