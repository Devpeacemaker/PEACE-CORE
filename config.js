require('dotenv').config();
const path = require('path');
// Import owner from set.js (Assumes set.js is in the main folder, one level up)
let set;
try {
    set = require('../set');
} catch (e) {
    // Fallback if set.js is inside the Database folder or not found
    try { set = require('./set'); } catch (e) { set = { owner: [] }; }
}

// ================= DEFAULT BOT SETTINGS =================
const defaultSettings = {
  antilink: 'on',
  antilinkall: 'off',
  autobio: 'on',
  antidelete: 'on',
  antitag: 'on',
  antibot: 'off',
  anticall: 'on',
antistatusmention: 'off',
  antiforeign: 'off',
  badword: 'off',
  gptdm: 'off',
  welcomegoodbye: 'off',
  autoread: 'off',
  mode: 'public',
  prefix: '.',
  autolike: 'on',
  autoview: 'on',
  wapresence: 'recording',
  antiedit: 'private',
    menuTitle: "PEACE-CORE",
    antigroupmention: 'off'
};


const usePostgres = !!process.env.DATABASE_URL;

let initializeDatabase, getSettings, updateSetting, addSudoOwner, removeSudoOwner, getSudoOwners, isSudoOwner, addBadword, removeBadword, getBadwords;

if (usePostgres) {
  // ==========================================================
  // 🟦 OPTION A: POSTGRESQL (Heroku / Render)
  // ==========================================================
  console.log("📡 Mode: Cloud (PostgreSQL detected)");
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  initializeDatabase = async function() {
    const client = await pool.connect();
    try {
      await client.query(`CREATE TABLE IF NOT EXISTS bot_settings (id SERIAL PRIMARY KEY, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL);`);
      await client.query(`CREATE TABLE IF NOT EXISTS sudo_owners (id SERIAL PRIMARY KEY, number TEXT UNIQUE NOT NULL);`);
      await client.query(`CREATE TABLE IF NOT EXISTS badwords (id SERIAL PRIMARY KEY, word TEXT UNIQUE NOT NULL);`);

      for (const [key, value] of Object.entries(defaultSettings)) {
        await client.query(`INSERT INTO bot_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING;`, [key, value]);
      }
      console.log("✅ PostgreSQL initialized.");
    } catch (err) { console.error("❌ PG Init Error:", err); } finally { client.release(); }
  };

  // ... (Postgres functions remain the same) ...
  getSettings = async function() { const client = await pool.connect(); try { const res = await client.query(`SELECT key, value FROM bot_settings`); const settings = {}; res.rows.forEach(row => settings[row.key] = row.value); return { ...defaultSettings, ...settings }; } catch (err) { return defaultSettings; } finally { client.release(); } };
  updateSetting = async function(key, value) { const client = await pool.connect(); try { await client.query(`INSERT INTO bot_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [key, value]); return true; } catch (err) { return false; } finally { client.release(); } };
  addSudoOwner = async function(number) { const client = await pool.connect(); try { await client.query(`INSERT INTO sudo_owners (number) VALUES ($1) ON CONFLICT DO NOTHING`, [number]); return true; } catch (err) { return false; } finally { client.release(); } };
  removeSudoOwner = async function(number) { const client = await pool.connect(); try { await client.query(`DELETE FROM sudo_owners WHERE number = $1`, [number]); return true; } catch (err) { return false; } finally { client.release(); } };
  getSudoOwners = async function() { const client = await pool.connect(); try { const res = await client.query(`SELECT number FROM sudo_owners`); return res.rows.map(r => r.number); } catch (err) { return []; } finally { client.release(); } };
  isSudoOwner = async function(number) { const client = await pool.connect(); try { const res = await client.query(`SELECT 1 FROM sudo_owners WHERE number = $1`, [number]); return res.rowCount > 0; } catch (err) { return false; } finally { client.release(); } };
  addBadword = async function(word) { const client = await pool.connect(); try { await client.query(`INSERT INTO badwords (word) VALUES ($1) ON CONFLICT DO NOTHING`, [word.toLowerCase()]); return true; } catch (err) { return false; } finally { client.release(); } };
  removeBadword = async function(word) { const client = await pool.connect(); try { await client.query(`DELETE FROM badwords WHERE word = $1`, [word.toLowerCase()]); return true; } catch (err) { return false; } finally { client.release(); } };
  getBadwords = async function() { const client = await pool.connect(); try { const res = await client.query(`SELECT word FROM badwords`); return res.rows.map(r => r.word); } catch (err) { return []; } finally { client.release(); } };

} else {
  // ==========================================================
  // 🟩 OPTION B: SQLITE3 (Panel / VPS / Local)
  // ==========================================================
  console.log("📡 Mode: Panel (Switching to SQLite)");
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(__dirname, 'database.db');
  const db = new sqlite3.Database(dbPath);

  function query(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
      } else {
        db.run(sql, params, function(err) { if (err) reject(err); else resolve(this); });
      }
    });
  }

  initializeDatabase = async function() {
    try {
      await query(`CREATE TABLE IF NOT EXISTS bot_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL);`);
      await query(`CREATE TABLE IF NOT EXISTS sudo_owners (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT UNIQUE NOT NULL);`);
      await query(`CREATE TABLE IF NOT EXISTS badwords (id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT UNIQUE NOT NULL);`);

      // 1. Sync Default Settings
      for (const [key, value] of Object.entries(defaultSettings)) {
        await query(`INSERT OR IGNORE INTO bot_settings (key, value) VALUES (?, ?)`, [key, value]);
      }

      // 2. 👑 AUTO-SYNC OWNER FROM SET.JS 👑
      // This loops through the owner list in set.js and adds them to the database
      if (set.owner && Array.isArray(set.owner)) {
        for (const num of set.owner) {
          if (num) {
            await query(`INSERT OR IGNORE INTO sudo_owners (number) VALUES (?)`, [num.trim()]);
          }
        }
        console.log(`✅ Auto-synced ${set.owner.length} owner(s) from set.js to SQLite.`);
      }

      console.log("✅ SQLite initialized.");
    } catch (err) { console.error("❌ SQLite Init Error:", err); }
  };

  // ... (SQLite functions remain the same) ...
  getSettings = async function() { try { const rows = await query(`SELECT key, value FROM bot_settings`); const settings = {}; rows.forEach(row => settings[row.key] = row.value); return { ...defaultSettings, ...settings }; } catch (err) { return defaultSettings; } };
  updateSetting = async function(key, value) { try { await query(`INSERT INTO bot_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, value]); return true; } catch (err) { return false; } };
  addSudoOwner = async function(number) { try { await query(`INSERT OR IGNORE INTO sudo_owners (number) VALUES (?)`, [number]); return true; } catch (err) { return false; } };
  removeSudoOwner = async function(number) { try { await query(`DELETE FROM sudo_owners WHERE number = ?`, [number]); return true; } catch (err) { return false; } };
  getSudoOwners = async function() { try { const rows = await query(`SELECT number FROM sudo_owners`); return rows.map(r => r.number); } catch (err) { return []; } };
  isSudoOwner = async function(number) { try { const rows = await query(`SELECT 1 FROM sudo_owners WHERE number = ?`, [number]); return rows.length > 0; } catch (err) { return false; } };
  addBadword = async function(word) { try { await query(`INSERT OR IGNORE INTO badwords (word) VALUES (?)`, [word.toLowerCase()]); return true; } catch (err) { return false; } };
  removeBadword = async function(word) { try { await query(`DELETE FROM badwords WHERE word = ?`, [word.toLowerCase()]); return true; } catch (err) { return false; } };
  getBadwords = async function() { try { const rows = await query(`SELECT word FROM badwords`); return rows.map(r => r.word); } catch (err) { return []; } };
}

module.exports = {
  initializeDatabase,
  getSettings,
  updateSetting,
  addSudoOwner,
  removeSudoOwner,
  getSudoOwners,
  isSudoOwner,
  addBadword,
  removeBadword,
  getBadwords
};
