/**
 * Symbol Table
 *
 * Maps names to their attributes (type, kind, scope, source location).
 * Implemented as a stack of maps so nested blocks can shadow outer names
 * and lookups walk from the innermost scope outward — the classic
 * compiler-design approach.
 */

export class SymbolTable {
  constructor() {
    this.scopes = [new Map()];
    this.records = [];
  }

  currentDepth() {
    return this.scopes.length - 1;
  }

  scopeName() {
    return this.currentDepth() === 0 ? 'global' : 'local';
  }

  enterScope() {
    this.scopes.push(new Map());
  }

  exitScope() {
    if (this.scopes.length > 1) {
      this.scopes.pop();
    }
  }

  /**
   * Insert a name into the current scope.
   * Returns { ok: false, existing } when the name is already declared here.
   */
  declare(name, info) {
    const current = this.scopes[this.scopes.length - 1];
    if (current.has(name)) {
      return { ok: false, existing: current.get(name) };
    }

    const entry = {
      name,
      type: info.type,
      kind: info.kind ?? 'variable',
      scope: this.scopeName(),
      line: info.line,
      column: info.column,
      initialized: info.initialized ?? false,
      used: false,
    };
    current.set(name, entry);
    this.records.push(entry);
    return { ok: true, entry };
  }

  lookup(name) {
    for (let i = this.scopes.length - 1; i >= 0; i -= 1) {
      if (this.scopes[i].has(name)) {
        return this.scopes[i].get(name);
      }
    }
    return null;
  }

  lookupCurrent(name) {
    return this.scopes[this.scopes.length - 1].get(name) ?? null;
  }

  markUsed(name) {
    const entry = this.lookup(name);
    if (entry) entry.used = true;
    return entry;
  }

  markInitialized(name) {
    const entry = this.lookup(name);
    if (entry) entry.initialized = true;
    return entry;
  }

  getUnused() {
    return this.records.filter((entry) => !entry.used);
  }

  toRows() {
    return this.records.map((entry) => ({
      name: entry.name,
      type: entry.type,
      kind: entry.kind,
      scope: entry.scope,
      line: entry.line,
    }));
  }
}
