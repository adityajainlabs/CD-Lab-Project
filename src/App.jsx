import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import CodeEditor from './components/CodeEditor.jsx';
import ErrorPanel from './components/ErrorPanel.jsx';
import TokenTable from './components/TokenTable.jsx';
import ASTViewer from './components/ASTViewer.jsx';
import SymbolTable from './components/SymbolTable.jsx';
import AnalysisSummary from './components/AnalysisSummary.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import { analyze } from './compiler/analyzer.js';
import { DEFAULT_EXAMPLE, EXAMPLE_PROGRAMS } from './examples/examplePrograms.js';

const TABS = [
  { id: 'errors', label: 'Errors' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'ast', label: 'AST' },
  { id: 'symbols', label: 'Symbol Table' },
];

const PIPELINE = [
  'Source Code',
  'Lexical Analysis',
  'Tokenization',
  'Syntax Analysis',
  'Semantic Analysis',
  'Error Detection',
  'Result',
];

export default function App() {
  const [code, setCode] = useState(DEFAULT_EXAMPLE.code);
  const [selectedExample, setSelectedExample] = useState(DEFAULT_EXAMPLE.id);
  const [result, setResult] = useState(() => analyze(DEFAULT_EXAMPLE.code));
  const [tab, setTab] = useState('errors');
  const [analyzing, setAnalyzing] = useState(false);
  const editorRef = useRef(null);
  const analyzeTimerRef = useRef(null);
  const resultsRef = useRef(null);

  const diagnostics = useMemo(
    () => [...(result?.errors ?? []), ...(result?.warnings ?? [])],
    [result],
  );

  useEffect(() => () => window.clearTimeout(analyzeTimerRef.current), []);

  const runAnalyze = (source = code) => {
    if (analyzing) return;
    setAnalyzing(true);
    window.clearTimeout(analyzeTimerRef.current);
    analyzeTimerRef.current = window.setTimeout(() => {
      setResult(analyze(source));
      setAnalyzing(false);
      window.requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }, 450);
  };

  const loadExample = (id) => {
    const example = EXAMPLE_PROGRAMS.find((item) => item.id === id) ?? DEFAULT_EXAMPLE;
    setSelectedExample(example.id);
    setCode(example.code);
    setResult(analyze(example.code));
    setTab('errors');
  };

  const clearEditor = () => {
    setCode('');
    setSelectedExample('');
    setResult(analyze(''));
  };

  const jumpTo = (item) => {
    editorRef.current?.focusLocation(item.line, item.column);
  };

  return (
    <div className="min-h-screen pb-10">
      <Header />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6">
        <section className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#0e1624] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-sky-300 ring-1 ring-sky-400/30">
              Language: CustomLang
            </span>
            <label className="flex items-center gap-2 text-sm text-slate-400">
              Example
              <select
                value={selectedExample}
                onChange={(event) => loadExample(event.target.value)}
                disabled={analyzing}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-sky-500 disabled:cursor-wait disabled:opacity-60"
              >
                <option value="" disabled>
                  Choose an example
                </option>
                {EXAMPLE_PROGRAMS.map((example) => (
                  <option key={example.id} value={example.id}>
                    {example.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runAnalyze()}
              disabled={analyzing}
              aria-busy={analyzing}
              className="inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-wait disabled:opacity-80"
            >
              {analyzing ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950/25 border-t-slate-950" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </button>
            <button
              type="button"
              onClick={clearEditor}
              disabled={analyzing}
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </section>

        <ol className={`flex gap-2 overflow-x-auto pb-1 text-[11px] uppercase tracking-wider text-slate-500 transition ${analyzing ? 'animate-pulse' : ''}`}>
          {PIPELINE.map((step, index) => (
            <li key={step} className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 ring-1 ring-slate-800">{step}</span>
              {index < PIPELINE.length - 1 && <span className="text-slate-700">→</span>}
            </li>
          ))}
        </ol>

        <CodeEditor
          ref={editorRef}
          value={code}
          onChange={setCode}
          diagnostics={diagnostics}
        />

        <div ref={resultsRef} id="analysis-results" className="scroll-mt-4">
          <AnalysisSummary summary={result?.summary} />
        </div>

        <section>
          <div className="mb-3 flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  tab === item.id
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-900 text-slate-300 ring-1 ring-slate-800 hover:text-white'
                }`}
              >
                {item.label}
                {item.id === 'errors' && result ? ` (${result.summary.errorCount})` : ''}
              </button>
            ))}
          </div>

          <div className="rounded-xl">
            {tab === 'errors' && (
              <ErrorPanel
                errors={result?.errors}
                warnings={result?.warnings}
                onSelect={jumpTo}
              />
            )}
            {tab === 'tokens' && <TokenTable tokens={result?.tokens} />}
            {tab === 'ast' && <ASTViewer ast={result?.ast} />}
            {tab === 'symbols' && <SymbolTable rows={result?.symbolTable} />}
          </div>
        </section>

        <HowItWorks />
      </main>
    </div>
  );
}
