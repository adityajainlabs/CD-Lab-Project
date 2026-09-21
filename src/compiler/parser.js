/**
 * Syntax Analyzer (Recursive-Descent Parser)
 *
 * Phase 2 of the compiler pipeline. Consumes the token stream produced by
 * the lexer and builds an Abstract Syntax Tree (AST) according to the
 * CustomLang grammar in grammar.js.
 *
 * Recursive descent means each grammar production is a function that
 * either matches its right-hand side or reports a syntax error and
 * synchronizes so the rest of the program can still be analyzed.
 */

import { TokenType, isTypeKeyword, COMPARISON_OPS, TERM_OPS, FACTOR_OPS } from './grammar.js';

export function parse(tokens) {
  const source = (tokens ?? []).filter(
    (t) => t.type !== TokenType.COMMENT && t.type !== TokenType.INVALID,
  );
  const errors = [];
  let current = 0;

  const isAtEnd = () => peek().type === TokenType.EOF;
  const peek = () => source[current] ?? source[source.length - 1];
  const previous = () => source[Math.max(0, current - 1)];

  const check = (type, lexeme = null) => {
    if (isAtEnd()) return false;
    const token = peek();
    if (token.type !== type) return false;
    if (lexeme !== null && token.lexeme !== lexeme) return false;
    return true;
  };

  const checkKeyword = (word) => check(TokenType.KEYWORD, word);

  const checkOp = (op) => check(TokenType.OPERATOR, op);

  const checkSep = (sep) => check(TokenType.SEPARATOR, sep);

  const advance = () => {
    if (!isAtEnd()) current += 1;
    return previous();
  };

  const matchKeyword = (...words) => {
    for (const word of words) {
      if (checkKeyword(word)) {
        advance();
        return true;
      }
    }
    return false;
  };

  const matchOp = (...ops) => {
    for (const op of ops) {
      if (checkOp(op)) {
        advance();
        return true;
      }
    }
    return false;
  };

  const matchType = (...types) => {
    for (const type of types) {
      if (check(type)) {
        advance();
        return true;
      }
    }
    return false;
  };

  const errorAt = (token, message, expected = null) => {
    const actual = token.type === TokenType.EOF ? 'EOF' : token.lexeme || token.type;
    errors.push({
      type: 'Syntax',
      message,
      line: token.line ?? 1,
      column: token.column ?? 1,
      expected,
      actual,
    });
  };

  const consume = (ok, message, expected) => {
    if (ok()) {
      return advance();
    }
    errorAt(peek(), message, expected);
    return peek();
  };

  /**
   * Panic-mode recovery: skip tokens until a statement boundary so one
   * mistake does not cascade into dozens of follow-on errors.
   */
  const synchronize = () => {
    advance();
    while (!isAtEnd()) {
      if (previous().type === TokenType.SEMICOLON) return;
      if (previous().lexeme === '}') return;
      if (checkKeyword('if') || checkKeyword('else') || checkKeyword('while') || checkKeyword('print')) {
        return;
      }
      if (check(TokenType.KEYWORD) && isTypeKeyword(peek().lexeme)) return;
      if (check(TokenType.IDENTIFIER) && source[current + 1]?.type === TokenType.ASSIGN) return;
      if (checkSep('{') || checkSep('}')) return;
      advance();
    }
  };

  const location = (token) => ({
    line: token.line,
    column: token.column,
  });

  // -------------------------------------------------------------------------
  // Expressions  (lowest → highest precedence)
  // -------------------------------------------------------------------------

  const expression = () => logicalOr();

  const logicalOr = () => {
    let left = logicalAnd();
    while (matchOp('||')) {
      const operator = previous();
      const right = logicalAnd();
      left = {
        kind: 'BinaryExpression',
        operator: operator.lexeme,
        left,
        right,
        ...location(operator),
      };
    }
    return left;
  };

  const logicalAnd = () => {
    let left = comparison();
    while (matchOp('&&')) {
      const operator = previous();
      const right = comparison();
      left = {
        kind: 'BinaryExpression',
        operator: operator.lexeme,
        left,
        right,
        ...location(operator),
      };
    }
    return left;
  };

  const comparison = () => {
    let left = term();
    while (
      check(TokenType.OPERATOR) &&
      COMPARISON_OPS.has(peek().lexeme)
    ) {
      const operator = advance();
      const right = term();
      left = {
        kind: 'BinaryExpression',
        operator: operator.lexeme,
        left,
        right,
        ...location(operator),
      };
    }
    return left;
  };

  const term = () => {
    let left = factor();
    while (check(TokenType.OPERATOR) && TERM_OPS.has(peek().lexeme)) {
      const operator = advance();
      const right = factor();
      left = {
        kind: 'BinaryExpression',
        operator: operator.lexeme,
        left,
        right,
        ...location(operator),
      };
    }
    return left;
  };

  const factor = () => {
    let left = unary();
    while (check(TokenType.OPERATOR) && FACTOR_OPS.has(peek().lexeme)) {
      const operator = advance();
      const right = unary();
      left = {
        kind: 'BinaryExpression',
        operator: operator.lexeme,
        left,
        right,
        ...location(operator),
      };
    }
    return left;
  };

  const unary = () => {
    if (matchOp('-', '!')) {
      const operator = previous();
      const operand = unary();
      return {
        kind: 'UnaryExpression',
        operator: operator.lexeme,
        operand,
        ...location(operator),
      };
    }
    return primary();
  };

  const primary = () => {
    if (matchType(TokenType.NUMBER)) {
      const token = previous();
      const valueType = String(token.lexeme).includes('.') ? 'float' : 'int';
      return {
        kind: 'Literal',
        value: token.literal,
        valueType,
        raw: token.lexeme,
        ...location(token),
      };
    }

    if (matchType(TokenType.STRING)) {
      const token = previous();
      return {
        kind: 'Literal',
        value: token.literal,
        valueType: 'string',
        raw: token.lexeme,
        ...location(token),
      };
    }

    if (matchType(TokenType.BOOLEAN)) {
      const token = previous();
      return {
        kind: 'Literal',
        value: token.literal,
        valueType: 'boolean',
        raw: token.lexeme,
        ...location(token),
      };
    }

    if (matchType(TokenType.IDENTIFIER)) {
      const token = previous();
      return {
        kind: 'Identifier',
        name: token.lexeme,
        ...location(token),
      };
    }

    if (checkSep('(')) {
      const open = advance();
      const expr = expression();
      if (!checkSep(')')) {
        errorAt(peek(), "Expected ')' after expression", ')');
        return {
          kind: 'Grouping',
          expression: expr,
          ...location(open),
        };
      }
      advance();
      return {
        kind: 'Grouping',
        expression: expr,
        ...location(open),
      };
    }

    const token = peek();
    errorAt(token, 'Expected expression', 'expression');
    return {
      kind: 'Error',
      message: 'Expected expression',
      ...location(token),
    };
  };

  // -------------------------------------------------------------------------
  // Statements
  // -------------------------------------------------------------------------

  const expectSemicolon = (afterWhat) => {
    if (check(TokenType.SEMICOLON)) {
      return advance();
    }
    const token = peek();
    const prev = previous();
    errorAt(
      {
        line: prev.line,
        column: prev.column + (prev.lexeme?.length ?? 0),
        lexeme: token.lexeme,
        type: token.type,
      },
      `Missing semicolon after ${afterWhat}`,
      ';',
    );
    return token;
  };

  const parseBlock = () => {
    const open = consume(() => checkSep('{'), "Expected '{' before block", '{');
    const statements = [];
    while (!isAtEnd() && !checkSep('}')) {
      const stmt = statement();
      if (stmt) statements.push(stmt);
    }
    consume(() => checkSep('}'), "Expected '}' after block", '}');
    return {
      kind: 'Block',
      statements,
      ...location(open),
    };
  };

  const declaration = () => {
    const typeToken = advance();
    if (!check(TokenType.IDENTIFIER)) {
      errorAt(peek(), `Expected identifier after type '${typeToken.lexeme}'`, 'IDENTIFIER');
      synchronize();
      return {
        kind: 'Error',
        message: 'Invalid declaration',
        ...location(typeToken),
      };
    }
    const nameToken = advance();
    let initializer = null;
    if (check(TokenType.ASSIGN)) {
      advance();
      initializer = expression();
    }
    expectSemicolon('declaration');
    return {
      kind: 'Declaration',
      varType: typeToken.lexeme,
      name: nameToken.lexeme,
      initializer,
      ...location(typeToken),
      nameLine: nameToken.line,
      nameColumn: nameToken.column,
    };
  };

  const assignment = () => {
    const nameToken = advance();
    consume(() => check(TokenType.ASSIGN), "Expected '=' in assignment", '=');
    const value = expression();
    expectSemicolon('assignment');
    return {
      kind: 'Assignment',
      name: nameToken.lexeme,
      value,
      ...location(nameToken),
    };
  };

  const printStatement = () => {
    const keyword = advance();
    consume(() => checkSep('('), "Expected '(' after 'print'", '(');
    const value = expression();
    consume(() => checkSep(')'), "Expected ')' after print argument", ')');
    expectSemicolon('print statement');
    return {
      kind: 'PrintStatement',
      expression: value,
      ...location(keyword),
    };
  };

  const ifStatement = () => {
    const keyword = advance();
    consume(() => checkSep('('), "Expected '(' after 'if'", '(');
    const condition = expression();
    consume(() => checkSep(')'), "Expected ')' after if condition", ')');
    const thenBranch = parseBlock();
    let elseBranch = null;
    if (matchKeyword('else')) {
      elseBranch = parseBlock();
    }
    return {
      kind: 'IfStatement',
      condition,
      thenBranch,
      elseBranch,
      ...location(keyword),
    };
  };

  const whileStatement = () => {
    const keyword = advance();
    consume(() => checkSep('('), "Expected '(' after 'while'", '(');
    const condition = expression();
    consume(() => checkSep(')'), "Expected ')' after while condition", ')');
    const body = parseBlock();
    return {
      kind: 'WhileStatement',
      condition,
      body,
      ...location(keyword),
    };
  };

  const statement = () => {
    try {
      if (check(TokenType.KEYWORD) && isTypeKeyword(peek().lexeme)) {
        return declaration();
      }
      if (checkKeyword('print')) {
        return printStatement();
      }
      if (checkKeyword('if')) {
        return ifStatement();
      }
      if (checkKeyword('while')) {
        return whileStatement();
      }
      if (checkKeyword('else')) {
        errorAt(peek(), "Unexpected 'else' without a matching 'if'", 'statement');
        synchronize();
        return null;
      }
      if (check(TokenType.IDENTIFIER)) {
        return assignment();
      }
      if (checkSep('{')) {
        return parseBlock();
      }
      if (check(TokenType.SEMICOLON)) {
        advance();
        return null;
      }

      errorAt(peek(), `Unexpected token '${peek().lexeme || peek().type}'`, 'statement');
      synchronize();
      return null;
    } catch {
      synchronize();
      return null;
    }
  };

  const statements = [];
  while (!isAtEnd()) {
    const stmt = statement();
    if (stmt) statements.push(stmt);
  }

  return {
    ast: {
      kind: 'Program',
      statements,
      line: 1,
      column: 1,
    },
    errors,
  };
}
