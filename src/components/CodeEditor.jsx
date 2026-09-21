import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Editor from '@monaco-editor/react';

const LANGUAGE_ID = 'customlang';

const CUSTOM_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '7dd3fc', fontStyle: 'bold' },
    { token: 'number', foreground: 'fbbf24' },
    { token: 'string', foreground: '86efac' },
    { token: 'string.escape', foreground: 'bbf7d0' },
    { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
    { token: 'identifier', foreground: 'e2e8f0' },
    { token: 'operator', foreground: 'f9a8d4' },
    { token: 'delimiter', foreground: '94a3b8' },
  ],
  colors: {
    'editor.background': '#0b1220',
    'editor.foreground': '#e6edf3',
    'editorLineNumber.foreground': '#64748b',
    'editorLineNumber.activeForeground': '#cbd5e1',
    'editor.lineHighlightBackground': '#1e293b66',
    'editorCursor.foreground': '#7dd3fc',
    'editor.selectionBackground': '#1d4ed655',
    'editorGutter.background': '#0b1220',
  },
};

function registerLanguage(monaco) {
  const alreadyRegistered = monaco.languages.getLanguages().some((lang) => lang.id === LANGUAGE_ID);
  if (!alreadyRegistered) {
    monaco.languages.register({ id: LANGUAGE_ID });
    monaco.languages.setLanguageConfiguration(LANGUAGE_ID, {
      comments: { lineComment: '//', blockComment: ['/*', '*/'] },
      brackets: [
        ['{', '}'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
      ],
    });

    monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, {
      keywords: ['int', 'float', 'string', 'boolean', 'if', 'else', 'while', 'print'],
      booleans: ['true', 'false'],
      tokenizer: {
        root: [
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          [/\d+\.\d+/, 'number'],
          [/\d+/, 'number'],
          [/[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@booleans': 'keyword',
              '@default': 'identifier',
            },
          }],
          [/[{}()]/, '@brackets'],
          [/==|!=|<=|>=|&&|\|\|/, 'operator'],
          [/[+\-*/%<>=!]/, 'operator'],
          [/;/, 'delimiter'],
          [/[ \t\r\n]+/, 'white'],
        ],
        comment: [
          [/\*\//, 'comment', '@pop'],
          [/./, 'comment'],
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop'],
        ],
      },
    });
  }

  monaco.editor.defineTheme('customlang-dark', CUSTOM_THEME);
}

function toMarkers(monaco, diagnostics) {
  const severityMap = {
    Lexical: monaco.MarkerSeverity.Error,
    Syntax: monaco.MarkerSeverity.Error,
    Semantic: monaco.MarkerSeverity.Error,
    Warning: monaco.MarkerSeverity.Warning,
  };

  return diagnostics.map((item) => {
    const length = Math.max(1, item.actual ? String(item.actual).length : 1);
    return {
      startLineNumber: item.line || 1,
      startColumn: item.column || 1,
      endLineNumber: item.line || 1,
      endColumn: (item.column || 1) + length,
      message: item.message,
      severity: severityMap[item.type] ?? monaco.MarkerSeverity.Error,
    };
  });
}

const CodeEditor = forwardRef(function CodeEditor(
  { value, onChange, diagnostics },
  ref,
) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focusLocation(line, column) {
      const editor = editorRef.current;
      if (!editor) return;
      const position = { lineNumber: line || 1, column: column || 1 };
      editor.revealPositionInCenter(position);
      editor.setPosition(position);
      editor.focus();
    },
  }));

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (!model) return;
    monaco.editor.setModelMarkers(model, 'customlang', toMarkers(monaco, diagnostics ?? []));
  }, [diagnostics, value]);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b1220] shadow-xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <span className="font-mono text-xs text-slate-400">main.cl</span>
        <span className="text-[11px] uppercase tracking-wider text-slate-500">CustomLang</span>
      </div>
      <div className="h-[420px] overflow-auto">
        <Editor
          height="100%"
          theme="customlang-dark"
          language={LANGUAGE_ID}
          value={value}
          onChange={(next) => onChange(next ?? '')}
          beforeMount={registerLanguage}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            monaco.editor.setTheme('customlang-dark');
            editor.updateOptions({
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                handleMouseWheel: true,
                alwaysConsumeMouseWheel: false,
                verticalScrollbarSize: 12,
                horizontalScrollbarSize: 12,
              },
            });
            editor.layout();
            const model = editor.getModel();
            if (model) {
              monaco.editor.setModelMarkers(model, 'customlang', toMarkers(monaco, diagnostics ?? []));
            }
          }}
          options={{
            fontLigatures: true,
            fontSize: 14,
            fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: true,
            automaticLayout: true,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            tabSize: 4,
            padding: { top: 12, bottom: 12 },
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            mouseWheelScrollSensitivity: 1,
            fastScrollSensitivity: 5,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              handleMouseWheel: true,
              alwaysConsumeMouseWheel: false,
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
              useShadows: false,
            },
            overviewRulerLanes: 0,
          }}
        />
      </div>
    </div>
  );
});

export default CodeEditor;
