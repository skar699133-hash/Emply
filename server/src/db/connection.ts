import { firestore } from './firebaseAdmin.js';
import { v4 as uuidv4 } from 'uuid';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

const KNOWN_COLLECTIONS = [
  'users',
  'departments',
  'teams',
  'team_members',
  'projects',
  'project_members',
  'request_categories',
  'request_slas',
  'leave_types',
  'leave_balances',
  'leave_review_hierarchies',
  'company_policies',
  'workplace_requests',
  'request_status_history',
  'request_comments',
  'request_escalations',
  'request_feedback',
  'leave_requests',
  'leave_reconsiderations',
  'leave_decision_history',
  'notifications',
  'audit_logs',
];

class Database {
  private collections: Map<string, Map<string, any>> = new Map();
  private initialized = false;

  private getTable(name: string): Map<string, any> {
    const clean = name.toLowerCase().trim();
    if (!this.collections.has(clean)) {
      this.collections.set(clean, new Map());
    }
    return this.collections.get(clean)!;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    console.log('Connecting to Firebase Cloud Firestore as primary database...');
    
    // Initialize collection maps
    for (const col of KNOWN_COLLECTIONS) {
      this.getTable(col);
    }

    if (firestore) {
      try {
        // Load existing documents from Firestore into memory
        for (const colName of KNOWN_COLLECTIONS) {
          try {
            const snapshot = await firestore.collection(colName).get();
            if (!snapshot.empty) {
              const table = this.getTable(colName);
              snapshot.forEach((doc) => {
                table.set(doc.id, doc.data());
              });
            }
          } catch (e: any) {
            // Collection might not exist yet, that's completely normal
          }
        }
        console.log('✅ Firebase Cloud Firestore synced successfully.');
      } catch (err: any) {
        console.warn('⚠️ Cloud Firestore sync note:', err.message);
      }
    } else {
      console.log('ℹ️ Running database service with in-memory store (Firebase credentials not yet provided).');
    }

    this.initialized = true;
  }

  private cleanVal(val: string | undefined, params: any[]): any {
    if (!val) return null;
    const str = val.trim();
    const matchParam = str.match(/^\$(\d+)$/);
    if (matchParam) {
      const idx = parseInt(matchParam[1], 10) - 1;
      return params[idx];
    }
    if ((str.startsWith("'") && str.endsWith("'")) || (str.startsWith('"') && str.endsWith('"'))) {
      return str.slice(1, -1);
    }
    if (str === 'true' || str === 'TRUE') return true;
    if (str === 'false' || str === 'FALSE') return false;
    if (str === 'null' || str === 'NULL') return null;
    if (!isNaN(Number(str)) && str !== '') return Number(str);
    return str;
  }

  async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.initialized) {
      await this.init();
    }

    const trimmed = text.trim();
    const upper = trimmed.toUpperCase();

    if (upper.startsWith('CREATE TABLE') || upper.startsWith('CREATE INDEX') || upper.startsWith('--')) {
      const match = trimmed.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-zA-Z0-9_]+)/i);
      if (match) this.getTable(match[1]);
      return { rows: [], rowCount: 0 };
    }

    if (upper.startsWith('INSERT INTO')) {
      return this.handleInsert<T>(trimmed, params);
    }

    if (upper.startsWith('UPDATE')) {
      return this.handleUpdate<T>(trimmed, params);
    }

    if (upper.startsWith('DELETE FROM')) {
      return this.handleDelete<T>(trimmed, params);
    }

    if (upper.startsWith('SELECT')) {
      return this.handleSelect<T>(trimmed, params);
    }

    return { rows: [], rowCount: 0 };
  }

  private async handleInsert<T = any>(sql: string, params: any[]): Promise<QueryResult<T>> {
    const match = sql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*(.+)/is);
    if (!match) return { rows: [], rowCount: 0 };

    const table = match[1].toLowerCase().trim();
    const cols = match[2].split(',').map((c) => c.trim().toLowerCase());
    let valuesPart = match[3];

    // Remove ON CONFLICT clause
    valuesPart = valuesPart.replace(/ON\s+CONFLICT\s+.*$/is, '').trim();

    // Match all value tuples: (v1, v2, ...)
    const tupleMatches = valuesPart.match(/\((?:[^)(]+|\((?:[^)(]+)\))*\)/g) || [valuesPart];
    const inserted: any[] = [];
    const tableMap = this.getTable(table);

    for (const tuple of tupleMatches) {
      const cleanTuple = tuple.replace(/^\(|\)$/g, '');
      const rawValues: string[] = [];
      let cur = '';
      let inQuote = false;
      let quoteChar = '';

      for (let i = 0; i < cleanTuple.length; i++) {
        const ch = cleanTuple[i];
        if ((ch === "'" || ch === '"') && (i === 0 || cleanTuple[i - 1] !== '\\')) {
          if (!inQuote) {
            inQuote = true;
            quoteChar = ch;
          } else if (ch === quoteChar) {
            inQuote = false;
          }
          cur += ch;
        } else if (ch === ',' && !inQuote) {
          rawValues.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      if (cur.trim()) rawValues.push(cur.trim());

      const row: Record<string, any> = {};
      cols.forEach((col, idx) => {
        const raw = rawValues[idx];
        if (raw && raw.startsWith('$')) {
          const pIdx = parseInt(raw.slice(1), 10) - 1;
          row[col] = params[pIdx];
        } else {
          row[col] = this.cleanVal(raw, params);
        }
      });

      const id = String(row.id || row.code || `gen-${uuidv4()}`);
      if (!row.id) row.id = id;
      if (!row.created_at) row.created_at = new Date().toISOString();
      if (!row.updated_at) row.updated_at = new Date().toISOString();

      tableMap.set(id, row);
      inserted.push(row);

      // Write to Firebase Cloud Firestore asynchronously
      if (firestore) {
        firestore
          .collection(table)
          .doc(id)
          .set(row, { merge: true })
          .catch((err) => console.warn(`Firestore write warning (${table}):`, err.message));
      }
    }

    return { rows: inserted as T[], rowCount: inserted.length };
  }

  private handleSelect<T = any>(sql: string, params: any[]): QueryResult<T> {
    // Fast path for COUNT(*)
    const countMatch = sql.match(/SELECT\s+COUNT\s*\(\s*\*\s*\)\s*(?:as\s+([a-zA-Z0-9_]+))?\s+FROM\s+([a-zA-Z0-9_]+)/i);
    if (countMatch) {
      const alias = countMatch[1] || 'count';
      const table = countMatch[2].toLowerCase();
      const count = this.getTable(table).size;
      return { rows: [{ [alias]: count, count }] as any[], rowCount: 1 };
    }

    // Extract FROM table and alias
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/i);
    if (!fromMatch) return { rows: [], rowCount: 0 };

    const mainTable = fromMatch[1].toLowerCase();
    const mainAlias = (fromMatch[2] || fromMatch[1]).toLowerCase();

    let rows: any[] = Array.from(this.getTable(mainTable).values()).map((r) => ({ ...r }));

    // Extract and execute LEFT JOINs
    const joinRegex = /(?:LEFT\s+)?JOIN\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?\s+ON\s+([^WHERE|ORDER|LIMIT|GROUP|JOIN]+)/gi;
    let joinMatch: RegExpExecArray | null;
    while ((joinMatch = joinRegex.exec(sql)) !== null) {
      const joinTable = joinMatch[1].toLowerCase();
      const joinAlias = (joinMatch[2] || joinMatch[1]).toLowerCase();
      const onCond = joinMatch[3].trim();

      const joinMap = this.getTable(joinTable);
      rows = rows.map((mainRow) => {
        let matched: any = null;
        for (const jRow of joinMap.values()) {
          if (this.evalJoinOn(mainRow, mainAlias, jRow, joinAlias, onCond)) {
            matched = jRow;
            break;
          }
        }
        const merged = { ...mainRow };
        if (matched) {
          for (const [k, v] of Object.entries(matched)) {
            merged[`${joinAlias}_${k}`] = v;
            merged[`${joinTable}_${k}`] = v;
            // Common relational aliases
            if (joinTable === 'departments' && k === 'name') merged.department_name = v;
            if (joinTable === 'teams' && k === 'name') merged.team_name = v;
            if (joinTable === 'users' && k === 'full_name') {
              if (joinAlias === 'au' || joinAlias === 'assigned_user') {
                merged.assigned_user_name = v;
              } else {
                merged.employee_name = v;
              }
            }
            if (joinTable === 'users' && k === 'email') merged.employee_email = v;
            if (joinTable === 'users' && k === 'avatar_url') merged.employee_avatar = v;
            if (joinTable === 'leave_types' && k === 'name') merged.leave_type_name = v;
            if (joinTable === 'leave_types' && k === 'code') merged.leave_type_code = v;
            if (joinTable === 'leave_types' && k === 'importance_level') merged.default_importance = v;
            if (joinTable === 'request_slas' && k === 'response_time_hours') merged.response_time_hours = v;
            if (joinTable === 'request_slas' && k === 'resolution_time_hours') merged.resolution_time_hours = v;
          }
        }
        return merged;
      });
    }

    // Filter WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+ORDER\s+BY|\s+LIMIT|\s+GROUP\s+BY|$)/is);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      rows = rows.filter((row) => this.evalWhere(row, whereClause, params, mainAlias));
    }

    // ORDER BY clause
    const orderMatch = sql.match(/ORDER\s+BY\s+(.*?)(?:\s+LIMIT|$)/is);
    if (orderMatch) {
      const orderFields = orderMatch[1].split(',').map((s) => s.trim());
      rows.sort((a, b) => {
        for (const ofield of orderFields) {
          const parts = ofield.split(/\s+/);
          const col = parts[0].replace(/^[a-zA-Z0-9_]+\./, '').toLowerCase();
          const desc = parts[1]?.toUpperCase() === 'DESC';
          const va = a[col] ?? '';
          const vb = b[col] ?? '';
          if (va < vb) return desc ? 1 : -1;
          if (va > vb) return desc ? -1 : 1;
        }
        return 0;
      });
    }

    // LIMIT clause
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1], 10);
      rows = rows.slice(0, limit);
    }

    return { rows: rows as T[], rowCount: rows.length };
  }

  private evalJoinOn(mainRow: any, mainAlias: string, joinRow: any, joinAlias: string, onClause: string): boolean {
    const parts = onClause.split(/\s+AND\s+/i);
    for (const part of parts) {
      const eq = part.split('=').map((s) => s.trim());
      if (eq.length === 2) {
        const left = this.getColVal(mainRow, mainAlias, joinRow, joinAlias, eq[0]);
        const right = this.getColVal(mainRow, mainAlias, joinRow, joinAlias, eq[1]);
        if (String(left) !== String(right)) return false;
      }
    }
    return true;
  }

  private getColVal(mainRow: any, mainAlias: string, joinRow: any, joinAlias: string, colRef: string): any {
    const dot = colRef.indexOf('.');
    if (dot !== -1) {
      const prefix = colRef.slice(0, dot).toLowerCase();
      const col = colRef.slice(dot + 1).toLowerCase();
      if (prefix === mainAlias) return mainRow[col];
      if (prefix === joinAlias) return joinRow[col];
    }
    const clean = colRef.toLowerCase();
    return mainRow[clean] !== undefined ? mainRow[clean] : joinRow[clean];
  }

  private evalWhere(row: any, clause: string, params: any[], _alias: string): boolean {
    // 1. LOWER(...) = LOWER(...)
    if (clause.includes('LOWER(')) {
      const match = clause.match(/LOWER\(([a-zA-Z0-9_.]+)\)\s*=\s*LOWER\((\$\d+|'[^']*')\)/i);
      if (match) {
        const col = match[1].replace(/^[a-zA-Z0-9_]+\./, '').toLowerCase();
        let target = match[2];
        if (target.startsWith('$')) {
          const idx = parseInt(target.slice(1), 10) - 1;
          target = params[idx];
        } else {
          target = target.slice(1, -1);
        }
        return String(row[col] || '').toLowerCase() === String(target || '').toLowerCase();
      }
    }

    // 2. Multi-condition evaluator with AND/OR
    const orParts = clause.split(/\s+OR\s+/i);
    if (orParts.length > 1 && !clause.includes('(')) {
      return orParts.some((sub) => this.evalWhere(row, sub.trim(), params, _alias));
    }

    const andParts = clause.split(/\s+AND\s+/i);
    for (const part of andParts) {
      const cleanPart = part.replace(/^\(|\)$/g, '').trim();

      // Check inner OR within parentheses
      if (cleanPart.includes(' OR ')) {
        const subOrs = cleanPart.split(/\s+OR\s+/i);
        const orResult = subOrs.some((sub) => this.evalSingleComparison(row, sub.trim(), params));
        if (!orResult) return false;
        continue;
      }

      if (!this.evalSingleComparison(row, cleanPart, params)) {
        return false;
      }
    }

    return true;
  }

  private evalSingleComparison(row: any, expr: string, params: any[]): boolean {
    const compMatch = expr.match(/([a-zA-Z0-9_.]+)\s*(=|!=|LIKE|ILIKE|IS|IS NOT|>|<|>=|<=)\s*(.+)/i);
    if (!compMatch) return true;

    const col = compMatch[1].replace(/^[a-zA-Z0-9_]+\./, '').toLowerCase();
    const op = compMatch[2].toUpperCase();
    let rawTarget = compMatch[3].trim();

    let target: any = rawTarget;
    if (rawTarget.startsWith('$')) {
      const pIdx = parseInt(rawTarget.slice(1), 10) - 1;
      target = params[pIdx];
    } else if (rawTarget.startsWith("'") && rawTarget.endsWith("'")) {
      target = rawTarget.slice(1, -1);
    } else if (rawTarget === 'true' || rawTarget === 'TRUE') target = true;
    else if (rawTarget === 'false' || rawTarget === 'FALSE') target = false;
    else if (rawTarget === 'null' || rawTarget === 'NULL') target = null;
    else if (!isNaN(Number(rawTarget))) target = Number(rawTarget);

    const actual = row[col];

    if (op === '=') return actual == target;
    if (op === '!=') return actual != target;
    if (op === 'IS') return actual === target;
    if (op === 'IS NOT') return actual !== target;
    if (op === '>') return Number(actual) > Number(target);
    if (op === '<') return Number(actual) < Number(target);
    if (op === '>=') return Number(actual) >= Number(target);
    if (op === '<=') return Number(actual) <= Number(target);
    if (op === 'LIKE' || op === 'ILIKE') {
      const pattern = String(target).replace(/%/g, '.*');
      const regex = new RegExp(`^${pattern}$`, op === 'ILIKE' ? 'i' : undefined);
      return regex.test(String(actual || ''));
    }

    return true;
  }

  private async handleUpdate<T = any>(sql: string, params: any[]): Promise<QueryResult<T>> {
    const match = sql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.*?)\s+WHERE\s+(.*)/is);
    if (!match) return { rows: [], rowCount: 0 };

    const table = match[1].toLowerCase().trim();
    const setPart = match[2].trim();
    const wherePart = match[3].trim();
    const tableMap = this.getTable(table);

    const assignments: Record<string, any> = {};
    const assignList = setPart.split(',').map((s) => s.trim());
    for (const a of assignList) {
      const [col, rawVal] = a.split('=').map((s) => s.trim());
      const cleanCol = col.toLowerCase();
      if (rawVal.startsWith('$')) {
        assignments[cleanCol] = params[parseInt(rawVal.slice(1), 10) - 1];
      } else {
        assignments[cleanCol] = this.cleanVal(rawVal, params);
      }
    }

    const updated: any[] = [];
    for (const [id, row] of tableMap.entries()) {
      if (this.evalWhere(row, wherePart, params, table)) {
        Object.assign(row, assignments, { updated_at: new Date().toISOString() });
        updated.push(row);

        // Update in Firebase Cloud Firestore
        if (firestore) {
          firestore
            .collection(table)
            .doc(id)
            .set(row, { merge: true })
            .catch((err) => console.warn(`Firestore update warning (${table}):`, err.message));
        }
      }
    }

    return { rows: updated as T[], rowCount: updated.length };
  }

  private async handleDelete<T = any>(sql: string, params: any[]): Promise<QueryResult<T>> {
    const match = sql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)\s+WHERE\s+(.*)/is);
    if (!match) return { rows: [], rowCount: 0 };
    const table = match[1].toLowerCase();
    const wherePart = match[2].trim();
    const tableMap = this.getTable(table);
    const deleted: any[] = [];

    for (const [id, row] of Array.from(tableMap.entries())) {
      if (this.evalWhere(row, wherePart, params, table)) {
        tableMap.delete(id);
        deleted.push(row);

        // Delete from Firebase Cloud Firestore
        if (firestore) {
          firestore
            .collection(table)
            .doc(id)
            .delete()
            .catch((err) => console.warn(`Firestore delete warning (${table}):`, err.message));
        }
      }
    }
    return { rows: deleted as T[], rowCount: deleted.length };
  }

  async exec(sql: string): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
    const stmts = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const s of stmts) {
      const match = s.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([a-zA-Z0-9_]+)/i);
      if (match) {
        this.getTable(match[1]);
      }
    }
  }
}

export const db = new Database();
