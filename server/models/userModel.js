'use strict';

const db = require('../database');

const PUBLIC_FIELDS = 'id, name, email, role, is_active, created_at';

function findByEmail(email) {
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
}

function findById(id) {
  return db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(id);
}

function findAll() {
  return db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users ORDER BY created_at DESC`).all();
}

function create({ name, email, passwordHash, role = 'admin' }) {
  const stmt = db.prepare(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`
  );
  const info = stmt.run(name, email, passwordHash, role);
  return findById(Number(info.lastInsertRowid));
}

function update(id, { name, role, is_active }) {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return null;
  db.prepare(
    `UPDATE users SET name = ?, role = ?, is_active = ? WHERE id = ?`
  ).run(
    name ?? existing.name,
    role ?? existing.role,
    is_active === undefined ? existing.is_active : is_active ? 1 : 0,
    id
  );
  return findById(id);
}

function updatePassword(id, passwordHash) {
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(passwordHash, id);
}

function remove(id) {
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return info.changes > 0;
}

function count() {
  return db.prepare('SELECT COUNT(*) AS total FROM users').get().total;
}

module.exports = { findByEmail, findById, findAll, create, update, updatePassword, remove, count };
