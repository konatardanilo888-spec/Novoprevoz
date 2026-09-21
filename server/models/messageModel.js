'use strict';

const db = require('../database');

function findAll() {
  return db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
}

function findById(id) {
  return db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id);
}

function create({ name, email, phone, message }) {
  const info = db
    .prepare(
      `INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)`
    )
    .run(name, email, phone || null, message);
  return findById(Number(info.lastInsertRowid));
}

function markRead(id) {
  db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(id);
  return findById(id);
}

function remove(id) {
  const info = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
  return info.changes > 0;
}

function unreadCount() {
  return db.prepare('SELECT COUNT(*) AS n FROM contact_messages WHERE is_read = 0').get().n;
}

module.exports = { findAll, findById, create, markRead, remove, unreadCount };
