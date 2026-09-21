'use strict';

/**
 * Sloj za konekciju na bazu podataka.
 *
 * Koristi ugrađeni Node.js "node:sqlite" modul (sinhroni DatabaseSync API),
 * dostupan od Node 22.5.0. Ovo namjerno ne koristi ORM kako bi kod ostao
 * transparentan i lako prenosiv na PostgreSQL (svi upiti su čist,
 * parametrizovan SQL - parametri se šalju odvojeno od upita, čime je
 * spriječena SQL injekcija).
 */

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('./config');

// Osiguraj da folder za bazu postoji.
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(config.databasePath);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Kreira šemu baze (idempotentno - IF NOT EXISTS), na osnovu
 * database/schema.sql.
 */
function initSchema() {
    const schemaSql = fs.readFileSync(config.schemaPath, 'utf8');
    db.exec(schemaSql);
}

/**
 * Dodaje kolone koje su uvedene poslije prve verzije šeme, za baze koje
 * već postoje na trajnom disku (CREATE TABLE IF NOT EXISTS ih ne bi dodao).
 * Svaki ALTER je zaštićen try/catch - ako kolona već postoji, greška se
 * jednostavno ignoriše.
 */
function addColumnIfMissing(table, column, definition) {
    try {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch (err) {
          if (!/duplicate column name/i.test(err.message)) throw err;
    }
}

function runMigrations() {
    addColumnIfMissing('notifications', 'title_en', 'TEXT');
    addColumnIfMissing('notifications', 'content_en', 'TEXT');
}

initSchema();
runMigrations();

module.exports = db;
