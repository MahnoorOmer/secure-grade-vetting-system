/**
 * SecureGrade – SQLite Database Layer
 * Uses Node's built-in `node:sqlite` (Node 22+) or falls back to
 * a promise-wrapper around the built-in `sqlite3` binary via child_process.
 *
 * For broader compatibility we use the `better-sqlite3`-style API via
 * the `Database` class from Node's experimental sqlite module OR we
 * initialise a simple sqlite3 shell-based helper.
 *
 * We'll use the `sqlite3` npm package pattern via raw SQL + a thin
 * promise wrapper so it works without adding new dependencies –
 * the database file itself is managed by Python's sqlite3 to bootstrap,
 * then Node reads/writes via child_process sqlite3 CLI.
 *
 * ACTUALLY: we use Node's built-in `child_process` + `sqlite3` CLI
 * as a zero-dependency approach, OR if better-sqlite3 is available we use that.
 *
 * Simplest approach: use Node's built-in `sqlite` (available Node 22.5+)
 * or fallback to a lightweight promise wrapper.
 */

const { execSync, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'securgrade.db');
const SCHEMA_PATH = path.join(__dirname, 'init.sql');

// ── Bootstrap: create DB + run schema if not exists ──────────────────────────
function initDatabase() {
  try {
    // Run the init.sql via sqlite3 CLI (available on most systems)
    execFileSync('sqlite3', [DB_PATH], {
      input: fs.readFileSync(SCHEMA_PATH, 'utf8'),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log('[DB] Database initialised at', DB_PATH);
  } catch (err) {
    // Try python3 sqlite3 as fallback
    try {
      const pyScript = `
import sqlite3, sys
conn = sqlite3.connect(sys.argv[1])
with open(sys.argv[2]) as f:
    conn.executescript(f.read())
conn.commit()
conn.close()
print('DB OK')
`;
      execFileSync('python3', ['-c', pyScript, DB_PATH, SCHEMA_PATH], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log('[DB] Database initialised via Python at', DB_PATH);
    } catch (pyErr) {
      console.error('[DB] Could not initialise database:', pyErr.message);
      throw new Error('Database initialisation failed. Ensure sqlite3 or python3 is installed.');
    }
  }
}

// ── Query helper (synchronous via sqlite3 CLI) ────────────────────────────────
function query(sql, params = []) {
  // Substitute ? placeholders with actual values (sqlite3 CLI doesn't support bound params)
  let finalSql = sql;
  params.forEach((p) => {
    let val;
    if (p === null || p === undefined) val = 'NULL';
    else if (typeof p === 'number') val = p;
    else val = `'${String(p).replace(/'/g, "''")}'`;
    finalSql = finalSql.replace('?', val);
  });

  try {
    const result = execFileSync('sqlite3', ['-json', DB_PATH, finalSql], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const text = result.toString().trim();
    if (!text) return [];
    return JSON.parse(text);
  } catch (err) {
    // stderr may contain the actual error
    const errMsg = err.stderr ? err.stderr.toString() : err.message;
    throw new Error(`DB query failed: ${errMsg}\nSQL: ${finalSql}`);
  }
}

// ── Run INSERT/UPDATE/DELETE and return last_insert_rowid ────────────────────
function run(sql, params = []) {
  let finalSql = sql;
  params.forEach((p) => {
    let val;
    if (p === null || p === undefined) val = 'NULL';
    else if (typeof p === 'number') val = p;
    else val = `'${String(p).replace(/'/g, "''")}'`;
    finalSql = finalSql.replace('?', val);
  });

  // Append a SELECT to get last insert rowid
  const combined = finalSql + '; SELECT last_insert_rowid() as id;';

  try {
    const result = execFileSync('sqlite3', ['-json', DB_PATH, combined], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const text = result.toString().trim();
    if (!text) return { lastID: null, changes: 0 };
    const rows = JSON.parse(text);
    const last = Array.isArray(rows) ? rows[rows.length - 1] : rows;
    return { lastID: last?.id ?? null, changes: 1 };
  } catch (err) {
    const errMsg = err.stderr ? err.stderr.toString() : err.message;
    throw new Error(`DB run failed: ${errMsg}\nSQL: ${finalSql}`);
  }
}

// ── Get single row ────────────────────────────────────────────────────────────
function get(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Initialise on first import
if (!fs.existsSync(DB_PATH)) {
  initDatabase();
} else {
  // Still run schema to apply any new tables (idempotent due to IF NOT EXISTS)
  initDatabase();
}

module.exports = { query, run, get, DB_PATH };
