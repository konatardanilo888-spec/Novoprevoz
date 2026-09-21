'use strict';

/**
 * Konfiguracija aplikacije.
 *
 * Napomena o zavisnostima: ovaj projekat NEMA pristup internetu / npm
 * registru u okruženju u kojem je generisan, pa je napravljen isključivo
 * pomoću Node.js ugrađenih (built-in) modula - bez ijednog paketa iz
 * node_modules. Zbog toga .env fajl učitavamo ručno (nema "dotenv"
 * paketa), umjesto bcrypt-a koristimo ugrađeni crypto.scrypt, umjesto
 * jsonwebtoken ugrađeni crypto.createHmac za JWT, umjesto express čist
 * Node "http" server sa sopstvenim minimalnim ruterom, i umjesto
 * better-sqlite3 ugrađeni "node:sqlite" modul (dostupan od Node 22.5+).
 * Ovo je detaljno objašnjeno u README.md, sa uputstvom kako projekat
 * kasnije "nadograditi" na Express/bcrypt/jsonwebtoken/better-sqlite3
 * ako se radi u okruženju sa pristupom internetu.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT_DIR = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');

/**
 * Minimalni .env parser (podržava KEY=VALUE, komentare sa #, prazne linije
 * i vrijednosti pod navodnicima). Ne prepisuje vrijednosti koje su već
 * postavljene kao prave environment varijable (isto ponašanje kao dotenv).
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(ENV_PATH);

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET || '';
if (!jwtSecret) {
  if (IS_PRODUCTION) {
    throw new Error(
      'JWT_SECRET nije postavljen u .env fajlu. Ovo je obavezno u produkciji.'
    );
  }
  // U razvoju generišemo privremeni ključ da aplikacija ne padne,
  // ali upozoravamo - tokeni neće preživjeti restart servera.
  jwtSecret = crypto.randomBytes(48).toString('hex');
  // eslint-disable-next-line no-console
  console.warn(
    '[UPOZORENJE] JWT_SECRET nije definisan u .env - koristi se privremeni ' +
      'nasumični ključ samo za ovu sesiju servera. Postavite JWT_SECRET u ' +
      '.env (vidi .env.example) da tokeni ostanu validni nakon restarta.'
  );
}

const config = {
  env: NODE_ENV,
  isProduction: IS_PRODUCTION,
  port: parseInt(process.env.PORT, 10) || 3000,
  rootDir: ROOT_DIR,
  publicDir: path.join(ROOT_DIR, 'public'),
  adminDir: path.join(ROOT_DIR, 'admin'),
  databasePath: path.join(ROOT_DIR, process.env.DATABASE_PATH || './database/database.sqlite'),
  schemaPath: path.join(ROOT_DIR, 'database', 'schema.sql'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cookieName: process.env.COOKIE_NAME || 'novoprevoz_token',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || 'Administrator',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@novoprevoz.me',
    password: process.env.SEED_ADMIN_PASSWORD || 'NovoPrevoz2026!',
  },
};

module.exports = config;
