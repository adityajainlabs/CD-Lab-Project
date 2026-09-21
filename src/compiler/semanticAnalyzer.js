/**
 * Semantic Analyzer
 *
 * Phase 3 of the compiler pipeline. Walks the AST to enforce meaning that
 * the grammar cannot capture:
 *   - every identifier must be declared before use
 *   - no duplicate declarations in the same scope
 *   - assigned / initialized values must match the variable's type
 *   - operators are applied to compatible operand types
 *
 * A Symbol Table is built during this walk and returned for the UI.
 */

import { SymbolTable } from './symbolTable.js';

const NUMERIC = new Set(['int', 'float']);

function isNumeric(type) {
  return NUMERIC.has(type);
}

function widen(left, right) {
  if (left === 'float' || right === 'float') return 'float';
  return 'int';
}

function typesCompatible(expected, actual) {
  if (!expected || !actual || actual === 'unknown' || expected === 'unknown') return true;
  if (expected === actual) return true;
  if (expected === 'float' && actual === 'int') return true;
  return false;
}

export function analyzeSemantics(ast) {
  const symbols = new SymbolTable();
  const errors = [];
  const warnings = [];

  const addError = (node, message, extra = {}) => {
    errors.push({
      type: 'Semantic',
      message,
      line: node?.line ?? 1,
      column: node?.column ?? 1,
      expected: extra.expected ?? null,
      actual: extra.actual ?? null,
    });
  };

  const addWarning = (node, message) => {
    warnings.push({
      type: 'Warning',
      message,
      line: node?.line ?? 1,
      column: node?.column ?? 1,
      expected: null,
      actual: null,
    });
  };

  const visit = (node) => {
    if (!node || node.kind === 'Error') return 'unknown';

    switch (node.kind) {
      case 'Program':
        node.statements.forEach(visit);
        return 'void';

      case 'Block': {
        symbols.enterScope();
        node.statements.forEach(visit);
        symbols.exitScope();
        return 'void';
      }

      case 'Declaration': {
        const initType = node.initializer ? visit(node.initializer) : null;
        const result = symbols.declare(node.name, {
          type: node.varType,
          kind: 'variable',
          line: node.nameLine ?? node.line,
          column: node.nameColumn ?? node.column,
          initialized: Boolean(node.initializer),
        });

        if (!result.ok) {
          addError(
            node,
            `Duplicate declaration of '${node.name}'. Previously declared at line ${result.existing.line}.`,
            { expected: 'new identifier', actual: node.name },
          );
        }

        if (node.initializer && initType && !typesCompatible(node.varType, initType)) {
          addError(
            node.initializer,
            `Cannot assign ${initType} to variable of type ${node.varType}.`,
            { expected: node.varType, actual: initType },
          );
        } else if (node.varType === 'int' && initType === 'float') {
          addWarning(node.initializer, `Assigning float to int variable '${node.name}' may lose precision.`);
        }

        return 'void';
      }

      case 'Assignment': {
        const valueType = visit(node.value);
        const entry = symbols.lookup(node.name);
        if (!entry) {
          addError(node, `Undefined variable '${node.name}'.`, {
            expected: 'declared identifier',
            actual: node.name,
          });
          return 'unknown';
        }
        if (!typesCompatible(entry.type, valueType)) {
          addError(node, `Cannot assign ${valueType} to variable of type ${entry.type}.`, {
            expected: entry.type,
            actual: valueType,
          });
        } else if (entry.type === 'int' && valueType === 'float') {
          addWarning(node, `Assigning float to int variable '${node.name}' may lose precision.`);
        }
        symbols.markInitialized(node.name);
        return entry.type;
      }

      case 'PrintStatement':
        visit(node.expression);
        return 'void';

      case 'IfStatement': {
        const condType = visit(node.condition);
        if (condType !== 'boolean' && condType !== 'unknown') {
          addWarning(node.condition, `If condition has type '${condType}'. A boolean expression is typical.`);
        }
        visit(node.thenBranch);
        if (node.elseBranch) visit(node.elseBranch);
        return 'void';
      }

      case 'WhileStatement': {
        const condType = visit(node.condition);
        if (condType !== 'boolean' && condType !== 'unknown') {
          addWarning(node.condition, `While condition has type '${condType}'. A boolean expression is typical.`);
        }
        visit(node.body);
        return 'void';
      }

      case 'BinaryExpression':
        return visitBinary(node);

      case 'UnaryExpression':
        return visitUnary(node);

      case 'Literal':
        return node.valueType;

      case 'Identifier': {
        const entry = symbols.lookup(node.name);
        if (!entry) {
          addError(node, `Undefined variable '${node.name}'.`, {
            expected: 'declared identifier',
            actual: node.name,
          });
          return 'unknown';
        }
        symbols.markUsed(node.name);
        if (!entry.initialized) {
          addWarning(node, `Variable '${node.name}' may be uninitialized.`);
        }
        return entry.type;
      }

      case 'Grouping':
        return visit(node.expression);

      default:
        return 'unknown';
    }
  };

  const visitBinary = (node) => {
    const left = visit(node.left);
    const right = visit(node.right);
    const op = node.operator;

    if (left === 'unknown' || right === 'unknown') return 'unknown';

    if (op === '+' || op === '-' || op === '*' || op === '/' || op === '%') {
      if (op === '+' && left === 'string' && right === 'string') {
        return 'string';
      }
      if (!isNumeric(left) || !isNumeric(right)) {
        addError(node, `Operator '${op}' cannot be applied to ${left} and ${right}.`, {
          expected: 'int or float',
          actual: `${left} ${op} ${right}`,
        });
        return 'unknown';
      }
      if (op === '/' && node.right?.kind === 'Literal' && Number(node.right.value) === 0) {
        addWarning(node, 'Division by zero.');
      }
      return widen(left, right);
    }

    if (op === '==' || op === '!=') {
      if (left !== right && !(isNumeric(left) && isNumeric(right))) {
        addError(node, `Cannot compare ${left} with ${right} using '${op}'.`, {
          expected: left,
          actual: right,
        });
      }
      return 'boolean';
    }

    if (op === '<' || op === '>' || op === '<=' || op === '>=') {
      if (!isNumeric(left) || !isNumeric(right)) {
        addError(node, `Operator '${op}' requires numeric operands, got ${left} and ${right}.`, {
          expected: 'int or float',
          actual: `${left} ${op} ${right}`,
        });
      }
      return 'boolean';
    }

    if (op === '&&' || op === '||') {
      if (left !== 'boolean' || right !== 'boolean') {
        addError(node, `Operator '${op}' requires boolean operands, got ${left} and ${right}.`, {
          expected: 'boolean',
          actual: `${left} ${op} ${right}`,
        });
      }
      return 'boolean';
    }

    addError(node, `Unknown operator '${op}'.`, { actual: op });
    return 'unknown';
  };

  const visitUnary = (node) => {
    const operand = visit(node.operand);
    if (node.operator === '-') {
      if (operand !== 'unknown' && !isNumeric(operand)) {
        addError(node, `Unary '-' requires a numeric operand, got ${operand}.`, {
          expected: 'int or float',
          actual: operand,
        });
        return 'unknown';
      }
      return operand === 'float' ? 'float' : 'int';
    }
    if (node.operator === '!') {
      if (operand !== 'unknown' && operand !== 'boolean') {
        addError(node, `Unary '!' requires a boolean operand, got ${operand}.`, {
          expected: 'boolean',
          actual: operand,
        });
      }
      return 'boolean';
    }
    return 'unknown';
  };

  if (ast) visit(ast);

  for (const unused of symbols.getUnused()) {
    addWarning(
      { line: unused.line, column: unused.column },
      `Variable '${unused.name}' is declared but never used.`,
    );
  }

  return {
    symbolTable: symbols.toRows(),
    errors,
    warnings,
  };
}
