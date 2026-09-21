/**
 * Lexical Analyzer (Scanner)
 *
 * Phase 1 of the compiler pipeline. Reads raw source characters and produces
 * a stream of tokens. Each token records its lexeme, type, line, and column
 * so later phases (and the UI) can point at the exact source location.
 *
 * Typical flow:
 *   skip whitespace → classify next lexeme → emit token or lexical error
 */

import {
  TokenType,
  KEYWORDS,
  BOOLEAN_LITERALS,
  TWO_CHAR_OPERATORS,
  ONE_CHAR_OPERATORS,
} from './grammar.js';

export function createToken(type, lexeme, line, column, literal = null) {
  return {
    type,
    lexeme,
    literal,
    line,
    column,
    length: lexeme.length,
  };
}

export function tokenize(source) {
  const tokens = [];
  const errors = [];
  const text = source ?? '';
  let i = 0;
  let line = 1;
  let column = 1;

  const peek = (offset = 0) => text[i + offset] ?? '';

  const advance = () => {
    const ch = text[i++];
    if (ch === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
    return ch;
  };

  const addError = (message, errLine, errColumn, lexeme = '') => {
    errors.push({
      type: 'Lexical',
      message,
      line: errLine,
      column: errColumn,
      expected: null,
      actual: lexeme || null,
    });
  };

  while (i < text.length) {
    const ch = peek();
    const startLine = line;
    const startColumn = column;

    // --- whitespace ---
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      advance();
      continue;
    }

    // --- line comment: // ... ---
    if (ch === '/' && peek(1) === '/') {
      let lexeme = '';
      while (peek() !== '' && peek() !== '\n') {
        lexeme += advance();
      }
      tokens.push(createToken(TokenType.COMMENT, lexeme, startLine, startColumn));
      continue;
    }

    // --- block comment: /* ... */ ---
    if (ch === '/' && peek(1) === '*') {
      let lexeme = advance() + advance();
      let closed = false;
      while (peek() !== '') {
        if (peek() === '*' && peek(1) === '/') {
          lexeme += advance() + advance();
          closed = true;
          break;
        }
        lexeme += advance();
      }
      if (!closed) {
        addError(
          'Unterminated block comment',
          startLine,
          startColumn,
          lexeme,
        );
        tokens.push(createToken(TokenType.INVALID, lexeme, startLine, startColumn));
      } else {
        tokens.push(createToken(TokenType.COMMENT, lexeme, startLine, startColumn));
      }
      continue;
    }

    // --- string literal ---
    if (ch === '"') {
      scanString(startLine, startColumn);
      continue;
    }

    // --- number: digits with an optional fractional part ---
    if (isDigit(ch)) {
      scanNumber(startLine, startColumn);
      continue;
    }

    // --- identifier / keyword / boolean ---
    if (isAlpha(ch)) {
      scanIdentifier(startLine, startColumn);
      continue;
    }

    // --- two-character operators ---
    const two = ch + peek(1);
    if (TWO_CHAR_OPERATORS.has(two)) {
      advance();
      advance();
      tokens.push(createToken(TokenType.OPERATOR, two, startLine, startColumn));
      continue;
    }

    // Incomplete logical operators are a common student mistake.
    if (ch === '&' || ch === '|') {
      const next = peek(1);
      if (next !== ch) {
        const found = advance();
        addError(
          `Incorrect operator '${found}'. Did you mean '${found}${found}'?`,
          startLine,
          startColumn,
          found,
        );
        tokens.push(createToken(TokenType.INVALID, found, startLine, startColumn));
        continue;
      }
    }

    // --- assignment vs equality: '=' is ASSIGN, '==' already handled ---
    if (ch === '=') {
      advance();
      tokens.push(createToken(TokenType.ASSIGN, '=', startLine, startColumn));
      continue;
    }

    if (ONE_CHAR_OPERATORS.has(ch)) {
      const op = advance();
      tokens.push(createToken(TokenType.OPERATOR, op, startLine, startColumn));
      continue;
    }

    if (ch === '(' || ch === ')' || ch === '{' || ch === '}' || ch === ',') {
      const sep = advance();
      tokens.push(createToken(TokenType.SEPARATOR, sep, startLine, startColumn));
      continue;
    }

    if (ch === ';') {
      advance();
      tokens.push(createToken(TokenType.SEMICOLON, ';', startLine, startColumn));
      continue;
    }

    // Anything else is an invalid token (e.g. '@', '#', '$').
    const bad = advance();
    addError(`Invalid token '${bad}' at line ${startLine}, column ${startColumn}`, startLine, startColumn, bad);
    tokens.push(createToken(TokenType.INVALID, bad, startLine, startColumn));
  }

  tokens.push(createToken(TokenType.EOF, '', line, column));
  return { tokens, errors };

  function scanString(startLine, startColumn) {
    let lexeme = advance(); // opening quote
    let value = '';
    let closed = false;

    while (peek() !== '') {
      if (peek() === '"') {
        lexeme += advance();
        closed = true;
        break;
      }
      if (peek() === '\n') {
        break;
      }
      if (peek() === '\\') {
        lexeme += advance();
        const escaped = peek();
        if (escaped === '') break;
        lexeme += advance();
        const map = { n: '\n', t: '\t', '"': '"', '\\': '\\' };
        value += map[escaped] ?? escaped;
        continue;
      }
      value += peek();
      lexeme += advance();
    }

    if (!closed) {
      addError('Unterminated string literal', startLine, startColumn, lexeme);
      tokens.push(createToken(TokenType.INVALID, lexeme, startLine, startColumn));
      return;
    }

    tokens.push(createToken(TokenType.STRING, lexeme, startLine, startColumn, value));
  }

  function scanNumber(startLine, startColumn) {
    let lexeme = '';
    while (isDigit(peek())) {
      lexeme += advance();
    }

    // Optional fractional part. Require at least one digit after the dot
    // so that "10." is reported as a lexical error rather than silently accepted.
    if (peek() === '.' && isDigit(peek(1))) {
      lexeme += advance();
      while (isDigit(peek())) {
        lexeme += advance();
      }
    } else if (peek() === '.') {
      lexeme += advance();
      addError(
        `Invalid numeric literal '${lexeme}'. A digit is required after the decimal point.`,
        startLine,
        startColumn,
        lexeme,
      );
      tokens.push(createToken(TokenType.INVALID, lexeme, startLine, startColumn));
      return;
    }

    // Reject identifiers glued to numbers: 10abc
    if (isAlpha(peek())) {
      while (isAlphaNumeric(peek())) {
        lexeme += advance();
      }
      addError(`Invalid token '${lexeme}'. Numbers cannot contain letters.`, startLine, startColumn, lexeme);
      tokens.push(createToken(TokenType.INVALID, lexeme, startLine, startColumn));
      return;
    }

    const literal = lexeme.includes('.') ? Number.parseFloat(lexeme) : Number.parseInt(lexeme, 10);
    tokens.push(createToken(TokenType.NUMBER, lexeme, startLine, startColumn, literal));
  }

  function scanIdentifier(startLine, startColumn) {
    let lexeme = '';
    while (isAlphaNumeric(peek())) {
      lexeme += advance();
    }

    if (BOOLEAN_LITERALS.has(lexeme)) {
      tokens.push(
        createToken(TokenType.BOOLEAN, lexeme, startLine, startColumn, lexeme === 'true'),
      );
      return;
    }

    if (KEYWORDS.has(lexeme)) {
      tokens.push(createToken(TokenType.KEYWORD, lexeme, startLine, startColumn));
      return;
    }

    tokens.push(createToken(TokenType.IDENTIFIER, lexeme, startLine, startColumn));
  }
}

function isDigit(ch) {
  return ch >= '0' && ch <= '9';
}

function isAlpha(ch) {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isAlphaNumeric(ch) {
  return isAlpha(ch) || isDigit(ch);
}

/**
 * Extra pass over tokens: unmatched parentheses / braces.
 * The parser also reports these, but this dedicated check produces a
 * clearer "unmatched bracket" message for the viva / error panel.
 */
export function checkBrackets(tokens) {
  const errors = [];
  const stack = [];
  const pairs = { ')': '(', '}': '{' };

  for (const token of tokens) {
    if (token.type !== TokenType.SEPARATOR) continue;
    if (token.lexeme === '(' || token.lexeme === '{') {
      stack.push(token);
    } else if (token.lexeme === ')' || token.lexeme === '}') {
      const open = pairs[token.lexeme];
      if (stack.length === 0 || stack[stack.length - 1].lexeme !== open) {
        errors.push({
          type: 'Syntax',
          message: `Unmatched '${token.lexeme}'`,
          line: token.line,
          column: token.column,
          expected: open,
          actual: token.lexeme,
        });
      } else {
        stack.pop();
      }
    }
  }

  for (const leftover of stack) {
    const close = leftover.lexeme === '(' ? ')' : '}';
    errors.push({
      type: 'Syntax',
      message: `Unmatched '${leftover.lexeme}'. Expected '${close}' before end of input.`,
      line: leftover.line,
      column: leftover.column,
      expected: close,
      actual: 'EOF',
    });
  }

  return errors;
}
