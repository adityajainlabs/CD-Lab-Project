/**
 * CustomLang grammar, token types, and keyword tables.
 *
 * This file is the single source of truth for the language definition so the
 * lexer, parser, and UI all describe the same language.
 *
 * Grammar (used by the recursive-descent parser):
 *
 *   program        → statement*
 *   statement      → declaration
 *                  | assignment
 *                  | ifStatement
 *                  | whileStatement
 *                  | printStatement
 *   declaration    → type IDENTIFIER ("=" expression)? ";"
 *   assignment     → IDENTIFIER "=" expression ";"
 *   printStatement → "print" "(" expression ")" ";"
 *   ifStatement    → "if" "(" expression ")" block ("else" block)?
 *   whileStatement → "while" "(" expression ")" block
 *   block          → "{" statement* "}"
 *
 *   expression     → logicalOr
 *   logicalOr      → logicalAnd ("||" logicalAnd)*
 *   logicalAnd     → comparison ("&&" comparison)*
 *   comparison     → term (("<" | ">" | "<=" | ">=" | "==" | "!=") term)*
 *   term           → factor (("+" | "-") factor)*
 *   factor         → unary (("*" | "/" | "%") unary)*
 *   unary          → ("-" | "!") unary | primary
 *   primary        → NUMBER | STRING | IDENTIFIER | BOOLEAN | "(" expression ")"
 *   type           → "int" | "float" | "string" | "boolean"
 */

export const TokenType = {
  KEYWORD: 'KEYWORD',
  IDENTIFIER: 'IDENTIFIER',
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  BOOLEAN: 'BOOLEAN',
  ASSIGN: 'ASSIGN',
  OPERATOR: 'OPERATOR',
  SEPARATOR: 'SEPARATOR',
  SEMICOLON: 'SEMICOLON',
  COMMENT: 'COMMENT',
  EOF: 'EOF',
  INVALID: 'INVALID',
};

/** Reserved words. true/false are tokenized as BOOLEAN, not KEYWORD. */
export const KEYWORDS = new Set([
  'int',
  'float',
  'string',
  'boolean',
  'if',
  'else',
  'while',
  'print',
]);

export const TYPE_KEYWORDS = new Set(['int', 'float', 'string', 'boolean']);

export const BOOLEAN_LITERALS = new Set(['true', 'false']);

/** Two-character operators are matched before single-character ones. */
export const TWO_CHAR_OPERATORS = new Set([
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
]);

export const ONE_CHAR_OPERATORS = new Set([
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>',
  '!',
]);

export const COMPARISON_OPS = new Set(['<', '>', '<=', '>=', '==', '!=']);
export const TERM_OPS = new Set(['+', '-']);
export const FACTOR_OPS = new Set(['*', '/', '%']);

export const GRAMMAR_TEXT = `program        → statement*
statement      → declaration
               | assignment
               | ifStatement
               | whileStatement
               | printStatement
declaration    → type IDENTIFIER ("=" expression)? ";"
assignment     → IDENTIFIER "=" expression ";"
printStatement → "print" "(" expression ")" ";"
ifStatement    → "if" "(" expression ")" block ("else" block)?
whileStatement → "while" "(" expression ")" block
block          → "{" statement* "}"
expression     → logicalOr
logicalOr      → logicalAnd ("||" logicalAnd)*
logicalAnd     → comparison ("&&" comparison)*
comparison     → term (("<" | ">" | "<=" | ">=" | "==" | "!=") term)*
term           → factor (("+" | "-") factor)*
factor         → unary (("*" | "/" | "%") unary)*
unary          → ("-" | "!") unary | primary
primary        → NUMBER | STRING | IDENTIFIER | BOOLEAN | "(" expression ")"
type           → "int" | "float" | "string" | "boolean"`;

export function isTypeKeyword(lexeme) {
  return TYPE_KEYWORDS.has(lexeme);
}
