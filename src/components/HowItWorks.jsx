import { GRAMMAR_TEXT } from '../compiler/grammar.js';

const TOPICS = [
  {
    title: '1. Lexical Analysis',
    body: 'The lexer reads the source character by character and groups them into tokens (KEYWORD, IDENTIFIER, NUMBER, OPERATOR, and so on). Whitespace is discarded. Invalid characters such as @ become lexical errors with a line and column.',
  },
  {
    title: '2. Syntax Analysis',
    body: 'The parser uses recursive descent: each grammar production is a function. It checks whether the token sequence matches the CustomLang grammar (declarations, if/while, expressions, blocks). Missing semicolons, unmatched brackets, and unexpected tokens are syntax errors.',
  },
  {
    title: '3. Abstract Syntax Tree',
    body: 'If parsing succeeds (or recovers), the parser builds an AST — a tree of nodes such as Program, Declaration, BinaryExpression, and IfStatement. Later phases walk this tree instead of the raw text. That is the standard compiler structure.',
  },
  {
    title: '4. Semantic Analysis',
    body: 'Semantics capture meaning the grammar cannot: a variable must be declared before use, names cannot be declared twice in the same scope, and types must match on assignment (int x = "hello" is illegal).',
  },
  {
    title: '5. Symbol Table',
    body: 'A stack of maps records each name with its type, kind, scope, and source line. Entering a { } block pushes a scope; leaving it pops. Lookup walks from the innermost scope outward, which is how nested blocks work in real compilers.',
  },
  {
    title: '6. Error Detection',
    body: 'Each phase reports errors independently, then the analyzer merges them. Panic-mode recovery skips to the next statement boundary so one mistake does not hide the rest of the program. The editor marks the exact line and column.',
  },
];

export default function HowItWorks() {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#0e1624]">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">How It Works</h2>
        <p className="mt-1 text-xs text-slate-400">
          Short explanations of the compiler pipeline for the viva.
        </p>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {TOPICS.map((topic) => (
          <article key={topic.title} className="rounded-lg bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold text-sky-300">{topic.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{topic.body}</p>
          </article>
        ))}
      </div>
      <div className="border-t border-slate-800 px-4 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          CustomLang Grammar
        </p>
        <pre className="overflow-x-auto rounded-lg bg-[#070b12] p-4 font-mono text-[11px] leading-5 text-slate-300">
          {GRAMMAR_TEXT}
        </pre>
      </div>
    </section>
  );
}
