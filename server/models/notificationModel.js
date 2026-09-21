'use strict';

const db = require('../database');

function findAll() {
  return db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all();
}

function findActive() {
  return db
    .prepare("SELECT * FROM notifications WHERE is_active = 1 ORDER BY created_at DESC")
    .all();
}

function findById(id) {
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
}

function create({ title, content, type = 'INFO', is_active = true }) {
  const info = db
    .prepare(
      `INSERT INTO notifications (title, content, type, is_active) VALUES (?, ?, ?, ?)`
    )
    .run(title, content, type, is_active ? 1 : 0);
  return findById(Number(info.lastInsertRowid));
}

function update(id, { title, content, type, is_active }) {
  const existing = findById(id);
  if (!existing) return null;
  db.prepare(
    `UPDATE notifications SET title = ?, content = ?, type = ?, is_active = ?,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
     WHERE id = ?`
  ).run(
    title ?? existing.title,
    content ?? existing.content,
    type ?? existing.type,
    is_active === undefined ? existing.is_active : is_active ? 1 : 0,
    id
  );
  return findById(id);
}

function remove(id) {
  const info = db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = { findAll, findActive, findById, create, update, remove };
