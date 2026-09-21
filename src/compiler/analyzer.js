/**
 * Analyzer facade
 *
 * Wires the compiler phases together:
 *
 *   Source Code
 *        ↓
 *   Lexical Analysis   (lexer.js)
 *        ↓
 *   Tokenization
 *        ↓
 *   Syntax Analysis    (parser.js)
 *        ↓
 *   Semantic Analysis  (semanticAnalyzer.js)
 *        ↓
 *   Error Detection + Result
 *
 * The UI only talks to this module. That keeps compiler logic independent
 * of React components — important for the viva explanation.
 */

import { tokenize, checkBrackets } from './lexer.js';
import { parse } from './parser.js';
import { analyzeSemantics } from './semanticAnalyzer.js';
import { TokenType } from './grammar.js';

function errorKey(error) {
  return `${error.type}|${error.line}|${error.column}|${error.message}`;
}

function dedupe(list) {
  const seen = new Set();
  const result = [];
  for (const item of list) {
    const key = errorKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function analyze(source) {
  const code = source ?? '';
  const { tokens, errors: lexicalErrors } = tokenize(code);
  const bracketErrors = checkBrackets(tokens);
  const { ast, errors: syntaxErrors } = parse(tokens);

  // Semantic analysis still walks a partial AST after panic-mode recovery.
  // That keeps the symbol table useful even when syntax errors exist.
  const semantic = ast
    ? analyzeSemantics(ast)
    : { symbolTable: [], errors: [], warnings: [] };

  const displayTokens = tokens.filter((t) => t.type !== TokenType.EOF);

  const errors = dedupe([
    ...lexicalErrors,
    ...bracketErrors,
    ...syntaxErrors,
    ...semantic.errors,
  ]);

  const warnings = dedupe(semantic.warnings ?? []);

  const lexicalCount = errors.filter((e) => e.type === 'Lexical').length;
  const syntaxCount = errors.filter((e) => e.type === 'Syntax').length;
  const semanticCount = errors.filter((e) => e.type === 'Semantic').length;

  return {
    tokens: displayTokens,
    ast,
    symbolTable: semantic.symbolTable,
    errors,
    warnings,
    summary: {
      tokenCount: displayTokens.filter((t) => t.type !== TokenType.COMMENT).length,
      errorCount: errors.length,
      warningCount: warnings.length,
      lexicalErrors: lexicalCount,
      syntaxErrors: syntaxCount,
      semanticErrors: semanticCount,
      passed: errors.length === 0,
    },
  };
}

export { TokenType };
