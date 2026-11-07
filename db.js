// Storage for bookings and messages.
// Local / single server: built-in SQLite file (data/dermiere.db).
// Hosted (Vercel): Postgres, used automatically when DATABASE_URL or POSTGRES_URL is set (e.g. Neon).
// Every method is async so the routes are identical for both. SQL is written with "?" placeholders.
const path = require('path');
const fs = require('fs');

const PG_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

function sqliteStore() {
  const { DatabaseSync } = require('node:sqlite');
  const file = process.env.DB_PATH || (process.env.VERCEL ? '/tmp/dermiere.db' : path.join(__dirname, 'data', 'dermiere.db'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT,
      location TEXT NOT NULL, service TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE INDEX IF NOT EXISTS idx_appt_slot ON appointments(location, date, time);
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, topic TEXT, message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL DEFAULT (datetime('now')));
  `);
  const ex = {
    all: async (sql, args = []) => db.prepare(sql).all(...args),
    get: async (sql, args = []) => db.prepare(sql).get(...args),
    run: async (sql, args = []) => ({ changes: Number(db.prepare(sql).run(...args).changes) }),
  };
  // SQLite is single-writer: BEGIN IMMEDIATE serialises bookings.
  let chain = Promise.resolve();
  const tx = (fn) => {
    const run = chain.then(async () => {
      db.exec('BEGIN IMMEDIATE');
      try { const r = await fn(ex); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
    });
    chain = run.catch(() => {});
    return run;
  };
  return { kind: 'sqlite', ready: Promise.resolve(), ...ex, tx };
}

function pgStore() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: PG_URL, max: 3, ssl: /localhost|127\.0\.0\.1/.test(PG_URL) ? false : { rejectUnauthorized: false } });
  const toPg = (sql) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); };
  const wrap = (q) => ({
    all: async (sql, args = []) => (await q(toPg(sql), args)).rows,
    get: async (sql, args = []) => (await q(toPg(sql), args)).rows[0],
    run: async (sql, args = []) => ({ changes: (await q(toPg(sql), args)).rowCount }),
  });
  const now = "to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS')";
  const ready = pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY, ref TEXT UNIQUE NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT,
      location TEXT NOT NULL, service TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT ${now});
    CREATE INDEX IF NOT EXISTS idx_appt_slot ON appointments(location, date, time);
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, topic TEXT, message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL DEFAULT ${now});
  `);
  ready.catch((e) => console.error('Database setup failed:', e.message)); // requests will report the error
  const tx = async (fn, lockKey = 'booking') => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey]); // one booking per slot-day at a time
      const r = await fn(wrap((s, a) => client.query(s, a)));
      await client.query('COMMIT');
      return r;
    } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; } finally { client.release(); }
  };
  return { kind: 'postgres', ready, ...wrap((s, a) => pool.query(s, a)), tx };
}

module.exports = PG_URL ? pgStore() : sqliteStore();
