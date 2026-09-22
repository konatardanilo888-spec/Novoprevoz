'use strict';

const db = require('../database');

function findAll() {
  return db.prepare('SELECT * FROM gallery ORDER BY sort_order ASC, created_at DESC').all();
}

function findById(id) {
  return db.prepare('SELECT * FROM gallery WHERE id = ?').get(id);
}

function remove(id) {
  const info = db.prepare('DELETE FROM gallery WHERE id = ?').run(id);
  return info.changes > 0;
}

function create({ image_data, caption = null, sort_order = 0 }) {
  const info = db
    .prepare('INSERT INTO gallery (image_data, caption, sort_order) VALUES (?, ?, ?)')
  .run(image_data, caption || null, sort_order || 0);
  return findById(Number(info.lastInsertRowid));
}

module.exports = { findAll, findById, create, remove };
