# Code Syntax & Error Detector

A web-based Compiler Design lab project. Paste CustomLang source code into the editor and the app runs a real front-end compiler pipeline in the browser: lexical analysis, tokenization, syntax analysis, semantic analysis, and error reporting.

No backend, database, or external compiler API is used. The analyzer lives in `src/compiler/`.

## Compiler pipeline

```text
Source Code
    → Lexical Analysis
    → Tokenization
    → Syntax Analysis
    → Semantic Analysis
    → Error Detection
    → Result
```

| Phase | Module | What it does |
| --- | --- | --- |
| Lexer | `src/compiler/lexer.js` | Scans characters into tokens and reports invalid lexemes |
| Parser | `src/compiler/parser.js` | Recursive-descent parse of the CustomLang grammar into an AST |
| Semantics | `src/compiler/semanticAnalyzer.js` | Type checks, undefined names, duplicate declarations |
| Symbols | `src/compiler/symbolTable.js` | Scoped name → type / kind / line table |
| Facade | `src/compiler/analyzer.js` | Runs the phases in order and merges diagnostics |

## Technologies

- React + Vite
- JavaScript
- Tailwind CSS
- Monaco Editor

## How to run

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). Use **Analyze** to run the pipeline, **Clear** to empty the editor, and the example dropdown to load the four built-in programs.

```bash
npm run build
```

creates a production build in `dist/`.

## Supported syntax (CustomLang)

A small C / JavaScript-like language.

- Types: `int`, `float`, `string`, `boolean`
- Statements: declarations, assignments, `if` / `else`, `while`, `print`
- Operators: `+ - * / %`, `< > <= >= == !=`, `&& || !`
- Grouping: `()`, blocks `{ }`, statements end with `;`
- Literals: numbers (`10`, `3.14`), strings (`"hello"`), `true` / `false`
- Comments: `// line` and `/* block */`

Example valid program:

```text
int x = 10;
int y = 20;

if (x < y) {
    print(x + y);
}
```

## Example programs

The UI ships four fixtures in `src/examples/examplePrograms.js`:

1. **Valid Program** — declarations plus a comparison and `print`
2. **Syntax Error** — missing semicolon and unmatched `(`
3. **Semantic Error** — `int` assigned a string, plus an undefined variable
4. **Lexical Error** — invalid token `@`

## Compiler Design concepts demonstrated

- **Lexical analysis** — character stream → tokens, with line/column
- **Token classes** — keyword, identifier, number, string, operator, separator, comment
- **Recursive-descent parsing** — one function per grammar production
- **Panic-mode recovery** — skip to `;` or `}` so later errors are still found
- **Abstract syntax tree** — statements and expressions as a tree, not raw text
- **Symbol table** — stack of scopes, lookup from inner to outer
- **Semantic checks** — undefined variables, duplicate declarations, type mismatch
- **Diagnostics** — lexical / syntax / semantic errors and warnings with source locations

The **How It Works** panel in the app restates these points in viva-friendly language and prints the grammar.
