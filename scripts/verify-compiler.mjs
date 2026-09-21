import { analyze } from '../src/compiler/analyzer.js';
import { EXAMPLE_PROGRAMS } from '../src/examples/examplePrograms.js';

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

const byId = Object.fromEntries(EXAMPLE_PROGRAMS.map((e) => [e.id, e]));

const valid = analyze(byId.valid.code);
if (valid.summary.errorCount !== 0) {
  fail(`valid program has errors: ${JSON.stringify(valid.errors, null, 2)}`);
} else {
  pass(`valid: 0 errors, ${valid.summary.tokenCount} tokens`);
}
if (!valid.ast?.statements || valid.ast.statements.length < 3) {
  fail(`valid AST should have 3 statements, got ${valid.ast?.statements?.length}`);
} else {
  pass(`valid AST statements: ${valid.ast.statements.map((s) => s.kind).join(', ')}`);
}
const names = valid.symbolTable.map((r) => r.name).sort();
if (names.join() !== 'x,y') {
  fail(`valid symbols expected x,y got ${names}`);
} else {
  pass(`valid symbol table: ${JSON.stringify(valid.symbolTable)}`);
}

const syntax = analyze(byId.syntax.code);
const syntaxTypes = syntax.errors.filter((e) => e.type === 'Syntax');
if (syntaxTypes.length === 0) {
  fail(`syntax example produced no syntax errors: ${JSON.stringify(syntax.errors, null, 2)}`);
} else {
  pass(`syntax: ${syntaxTypes.length} syntax errors`);
  syntax.errors.forEach((e) => console.log('   ', e.type, `L${e.line}:C${e.column}`, e.message));
}
const missingSemi = syntax.errors.some((e) => /semicolon/i.test(e.message));
const unmatched = syntax.errors.some((e) => /\)|unmatched/i.test(e.message));
if (!missingSemi) fail('syntax example missing semicolon error');
else pass('syntax: missing semicolon detected');
if (!unmatched) fail('syntax example missing unmatched/expected ) error');
else pass('syntax: unmatched/missing ) detected');

const semantic = analyze(byId.semantic.code);
const semErrs = semantic.errors.filter((e) => e.type === 'Semantic');
if (!semErrs.some((e) => /string/i.test(e.message) && /int/i.test(e.message))) {
  fail(`semantic type mismatch not found: ${JSON.stringify(semantic.errors, null, 2)}`);
} else {
  pass('semantic: type mismatch detected');
}
if (!semErrs.some((e) => /Undefined variable 'y'/i.test(e.message))) {
  fail(`undefined y not found: ${JSON.stringify(semantic.errors, null, 2)}`);
} else {
  pass('semantic: undefined variable y detected');
}
semantic.errors.forEach((e) => console.log('   ', e.type, `L${e.line}:C${e.column}`, e.message));

const lexical = analyze(byId.lexical.code);
const lex = lexical.errors.filter((e) => e.type === 'Lexical');
if (!lex.some((e) => e.actual === '@' && e.line === 1 && e.column === 5)) {
  fail(`lexical @ not at 1:5: ${JSON.stringify(lexical.errors, null, 2)}`);
} else {
  pass("lexical: invalid token '@' at line 1, column 5");
}
lexical.errors.forEach((e) => console.log('   ', e.type, `L${e.line}:C${e.column}`, e.message));

const tokens = analyze('int x = 10;').tokens.map((t) => `${t.type}:${t.lexeme}`);
const expected = ['KEYWORD:int', 'IDENTIFIER:x', 'ASSIGN:=', 'NUMBER:10', 'SEMICOLON:;'];
if (tokens.join() !== expected.join()) {
  fail(`token stream ${tokens.join(' | ')}`);
} else {
  pass(`tokens: ${tokens.join(' → ')}`);
}

const missingExpr = analyze('int x = ;');
if (!missingExpr.errors.some((e) => /expression/i.test(e.message))) {
  fail(`int x = ; errors: ${JSON.stringify(missingExpr.errors, null, 2)}`);
} else {
  pass('int x = ; expected expression');
}

const missingId = analyze('int = 10;');
if (!missingId.errors.some((e) => /identifier/i.test(e.message))) {
  fail(`int = 10; errors: ${JSON.stringify(missingId.errors, null, 2)}`);
} else {
  pass('int = 10; expected identifier');
}

const dup = analyze('int x = 10;\nint x = 20;');
if (!dup.errors.some((e) => /Duplicate/i.test(e.message))) {
  fail(`duplicate errors: ${JSON.stringify(dup.errors, null, 2)}`);
} else {
  pass('duplicate declaration detected');
}

console.log(process.exitCode ? '\nSome checks failed.' : '\nAll compiler checks passed.');
