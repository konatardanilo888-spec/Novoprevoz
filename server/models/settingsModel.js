'use strict';

const db = require('../database');

const DEFAULTS = {
  site_name: 'NOVOPREVOZ',
  contact_phone: '+382 20 123 456',
  contact_email: 'info@novoprevoz.me',
  contact_address: 'Bulevar Svetog Petra Cetinjskog bb, Podgorica, Crna Gora',
  working_hours: 'Ponedjeljak - Nedjelja: 06:00 - 22:00',
};

function getAll() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = { ...DEFAULTS };
  rows.forEach((row) => {
    map[row.key] = row.value;
  });
  return map;
}

function get(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : DEFAULTS[key];
}

function set(key, value) {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, String(value));
  return get(key);
}

function setMany(entries) {
  for (const [key, value] of Object.entries(entries)) {
    set(key, value);
  }
  return getAll();
}

module.exports = { getAll, get, set, setMany, DEFAULTS };
