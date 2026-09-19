import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { Pool } = pg;

export function resolvePostgresConfig() {
  let rawUrl = (process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL || '').trim();

  // Strip accidental wrapping quotes or parentheses (e.g. copied from markdown "(postgresql://...)" or quotes)
  rawUrl = rawUrl.replace(/^[("'\s]+|[)"';\s]+$/g, '').trim();

  const hasPlaceholders = rawUrl.includes('${{');

  if (hasPlaceholders) {
    let replaced = rawUrl.replace(/\$\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, varName) => {
      return process.env[varName] || '';
    });

    const isUnresolved =
      replaced.includes('@:/') ||
      replaced.includes('://@') ||
      replaced.includes('://:') ||
      replaced.endsWith('@/') ||
      replaced.includes('${{');

    if (isUnresolved) {
      return {
        configured: false,
        connectionString: null,
        displayPreview: rawUrl,
        reason: 'Unresolved template placeholders in URL',
      };
    }

    rawUrl = replaced;
  }

  // Check if rawUrl still contains literal ':PORT' (common copy-paste mistake from Railway template)
  if (rawUrl && (rawUrl.includes(':PORT/') || rawUrl.includes(':PORT') || /:PORT\b/i.test(rawUrl))) {
    return {
      configured: false,
      connectionString: null,
      displayPreview: rawUrl,
      reason: "Placeholder ':PORT' found in URL. Please replace with the actual numeric port from Railway or your PostgreSQL provider.",
    };
  }

  if (rawUrl && (rawUrl.startsWith('postgres://') || rawUrl.startsWith('postgresql://'))) {
    return {
      configured: true,
      connectionString: rawUrl,
      displayPreview: rawUrl.replace(/:[^:@]+@/, ':****@'),
    };
  }

  // Discrete variables
  if (process.env.RAILWAY_TCP_PROXY_DOMAIN && process.env.PGPASSWORD) {
    const user = process.env.PGUSER || 'postgres';
    const password = process.env.PGPASSWORD;
    const host = process.env.RAILWAY_TCP_PROXY_DOMAIN || process.env.PGHOST || 'localhost';
    const port = process.env.RAILWAY_TCP_PROXY_PORT || process.env.PGPORT || '5432';
    const database = process.env.PGDATABASE || 'railway';

    const connectionString = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    return {
      configured: true,
      connectionString,
      displayPreview: connectionString.replace(/:[^:@]+@/, ':****@'),
    };
  }

  return {
    configured: false,
    connectionString: null,
    displayPreview: 'postgresql://${{PGUSER}}:${{PGPASSWORD}}@${{RAILWAY_TCP_PROXY_DOMAIN}}:${{RAILWAY_TCP_PROXY_PORT}}/${{PGDATABASE}}',
    reason: 'No PostgreSQL connection string configured.',
  };
}

let activeEngine = 'none'; // 'postgresql' | 'sqlite'
let pgPool = null;
let sqliteDb = null;
let lastDbError = null;

// Initialize SQLite fallback database
function getSqliteDb() {
  if (sqliteDb) return sqliteDb;

  let dbPath;
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );

  if (isServerless) {
    // In serverless environments, only /tmp (os.tmpdir()) is writable
    dbPath = path.join(os.tmpdir(), 'dealmind.db');
  } else {
    try {
      const dataDir = path.resolve(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      dbPath = path.join(dataDir, 'dealmind.db');
    } catch (err) {
      console.warn('⚠️ Could not create data directory, using temp directory:', err.message);
      dbPath = path.join(os.tmpdir(), 'dealmind.db');
    }
  }

  try {
    sqliteDb = new DatabaseSync(dbPath);
  } catch (err) {
    console.warn(`⚠️ Failed to open SQLite at ${dbPath}, falling back to in-memory:`, err.message);
    sqliteDb = new DatabaseSync(':memory:');
  }

  // Initialize SQLite tables
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      display_name TEXT NOT NULL,
      photo_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      gemini_key TEXT,
      opponent_style TEXT DEFAULT 'professional',
      coaching_style TEXT DEFAULT 'balanced',
      currency TEXT DEFAULT '₹',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS negotiations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      current_offer NUMERIC,
      desired_offer NUMERIC,
      walk_away NUMERIC,
      min_acceptable NUMERIC,
      max_desired NUMERIC,
      batna TEXT,
      context TEXT,
      strengths TEXT,
      deadline TEXT,
      other_party TEXT,
      relationship TEXT,
      analysis TEXT,
      status TEXT DEFAULT 'draft',
      score NUMERIC,
      final_offer NUMERIC,
      messages TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_negotiations_user_id ON negotiations(user_id);
  `);

  console.log(`💾 Persistent Local Database initialized at: ${dbPath}`);
  return sqliteDb;
}

export async function initDb() {
  const pgConfig = resolvePostgresConfig();

  // If PostgreSQL is configured with real credentials, try connecting to it
  if (pgConfig.configured && pgConfig.connectionString) {
    try {
      const isLocal = pgConfig.connectionString.includes('localhost') || pgConfig.connectionString.includes('127.0.0.1');
      const useSsl = !isLocal || process.env.PGSSL === 'true';

      if (!pgPool) {
        pgPool = new Pool({
          connectionString: pgConfig.connectionString,
          ssl: useSsl ? { rejectUnauthorized: false } : false,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 7000,
        });

        pgPool.on('error', (err) => {
          console.warn('⚠️ Unexpected error on idle PostgreSQL client:', err.message);
        });
      }

      const client = await pgPool.connect();
      console.log('✅ Connected to PostgreSQL database successfully!');

      // PostgreSQL Schema
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(128) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          display_name VARCHAR(255) NOT NULL,
          photo_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_settings (
          user_id VARCHAR(128) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          gemini_key TEXT,
          opponent_style VARCHAR(50) DEFAULT 'professional',
          coaching_style VARCHAR(50) DEFAULT 'balanced',
          currency VARCHAR(10) DEFAULT '₹',
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS negotiations (
          id VARCHAR(128) PRIMARY KEY,
          user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          current_offer NUMERIC,
          desired_offer NUMERIC,
          walk_away NUMERIC,
          min_acceptable NUMERIC,
          max_desired NUMERIC,
          batna TEXT,
          context TEXT,
          strengths TEXT,
          deadline VARCHAR(100),
          other_party VARCHAR(255),
          relationship VARCHAR(100),
          analysis JSONB,
          status VARCHAR(50) DEFAULT 'draft',
          score NUMERIC,
          final_offer NUMERIC,
          messages JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_negotiations_user_id ON negotiations(user_id);
        CREATE INDEX IF NOT EXISTS idx_negotiations_created_at ON negotiations(created_at DESC);
      `);

      client.release();
      activeEngine = 'postgresql';
      lastDbError = null;
      console.log('✅ PostgreSQL tables verified and active!');
      return true;
    } catch (err) {
      console.warn('⚠️ PostgreSQL connection failed:', err.message);
      lastDbError = err.message;
      if (pgPool) {
        try { await pgPool.end(); } catch { /* ignore */ }
        pgPool = null;
      }
    }
  } else if (pgConfig.reason) {
    lastDbError = pgConfig.reason;
  }

  // Use persistent local database engine fallback
  try {
    getSqliteDb();
    activeEngine = 'sqlite';
    console.log('✅ Database Engine active: SQLite Database (Fallback/Serverless)');
    return true;
  } catch (err) {
    console.error('❌ Failed to initialize SQLite database fallback:', err);
    lastDbError = err.message;
    return false;
  }
}

export function getDbStatus() {
  const pgConfig = resolvePostgresConfig();
  return {
    connected: activeEngine !== 'none',
    engine: activeEngine,
    description: activeEngine === 'postgresql'
      ? 'Connected to PostgreSQL (Cloud)'
      : (activeEngine === 'sqlite'
          ? (process.env.VERCEL ? 'Active: Ephemeral Serverless SQLite (Configure PostgreSQL for permanent persistence)' : 'Active: Persistent Local Database')
          : 'Database Disconnected'),
    connectionStringPreview: pgConfig.displayPreview,
    configStatus: pgConfig.configured ? 'Configured' : (pgConfig.reason || 'Not configured'),
    error: lastDbError,
  };
}

/**
 * Universal Query Adapter:
 * Seamlessly executes queries against PostgreSQL or persistent SQLite
 * Converts Postgres $1, $2 parameter placeholders to SQLite ? placeholders automatically.
 */
export async function query(sql, params = []) {
  if (activeEngine === 'none') {
    await initDb();
  }

  if (activeEngine === 'postgresql' && pgPool) {
    return pgPool.query(sql, params);
  }

  if (activeEngine === 'sqlite') {
    const db = getSqliteDb();

    // Convert PostgreSQL $1, $2 syntax to SQLite ? syntax
    let sqliteSql = sql.replace(/\$([0-9]+)/g, '?');

    // Convert CURRENT_TIMESTAMP in updates
    sqliteSql = sqliteSql.replace(/CURRENT_TIMESTAMP/g, "datetime('now')");

    // Handle JSONB casts
    sqliteSql = sqliteSql.replace(/::jsonb/g, '');

    // Handle RETURNING clause for SQLite
    const hasReturning = /RETURNING\s+(.+)$/i.test(sqliteSql);
    let returningCols = [];
    if (hasReturning) {
      const match = sqliteSql.match(/RETURNING\s+(.+)$/i);
      returningCols = match ? match[1].split(',').map(c => c.trim()) : ['*'];
      sqliteSql = sqliteSql.replace(/RETURNING\s+.+$/i, '').trim();
    }

    const isSelect = /^\s*SELECT/i.test(sqliteSql);

    // Convert boolean / object params for SQLite
    const cleanParams = params.map(p => {
      if (typeof p === 'object' && p !== null) {
        return JSON.stringify(p);
      }
      return p;
    });

    try {
      const stmt = db.prepare(sqliteSql);

      if (isSelect) {
        const rawRows = stmt.all(...cleanParams);
        // Normalize rows (parse JSON fields)
        const rows = rawRows.map(row => normalizeRow(row));
        return { rows, rowCount: rows.length };
      } else {
        const info = stmt.run(...cleanParams);

        if (hasReturning) {
          // If INSERT, retrieve the inserted row
          if (/^\s*INSERT/i.test(sqliteSql)) {
            // Find id from params
            const idParam = params[0];
            if (idParam) {
              const tableMatch = sqliteSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
              const table = tableMatch ? tableMatch[1] : 'users';
              const selectStmt = db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
              const inserted = selectStmt.get(idParam);
              const rows = inserted ? [normalizeRow(inserted)] : [];
              return { rows, rowCount: rows.length };
            }
          } else if (/^\s*UPDATE/i.test(sqliteSql)) {
            // For updates, the id is typically the last or second to last param
            const idParam = params[params.length - 2] || params[params.length - 1];
            const tableMatch = sqliteSql.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
            const table = tableMatch ? tableMatch[1] : 'negotiations';
            if (idParam) {
              const selectStmt = db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
              const updated = selectStmt.get(idParam);
              const rows = updated ? [normalizeRow(updated)] : [];
              return { rows, rowCount: rows.length };
            }
          }
        }

        return { rows: [], rowCount: info.changes };
      }
    } catch (err) {
      console.error('SQL Execution Error:', err.message, { sql: sqliteSql, params });
      throw err;
    }
  }

  throw new Error(`Database is not initialized. (Engine: ${activeEngine}, Last Error: ${lastDbError || 'Please check database credentials or network connection.'})`);
}

function normalizeRow(row) {
  if (!row) return row;
  const copy = { ...row };

  // Parse JSON columns if they are strings
  if (typeof copy.analysis === 'string') {
    try { copy.analysis = JSON.parse(copy.analysis); } catch { /* ignore */ }
  }
  if (typeof copy.messages === 'string') {
    try { copy.messages = JSON.parse(copy.messages); } catch { /* ignore */ }
  }
  return copy;
}
