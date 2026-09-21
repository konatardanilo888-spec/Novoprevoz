'use strict';

const db = require('../database');

function findAll() {
  return db.prepare('SELECT * FROM stations ORDER BY city ASC, name ASC').all();
}

function findById(id) {
  return db.prepare('SELECT * FROM stations WHERE id = ?').get(id);
}

function create({ name, city, address, phone, description }) {
  const info = db
    .prepare(
      `INSERT INTO stations (name, city, address, phone, description) VALUES (?, ?, ?, ?, ?)`
    )
    .run(name, city, address || null, phone || null, description || null);
  return findById(Number(info.lastInsertRowid));
}

function update(id, { name, city, address, phone, description }) {
  const existing = findById(id);
  if (!existing) return null;
  db.prepare(
    `UPDATE stations SET name = ?, city = ?, address = ?, phone = ?, description = ? WHERE id = ?`
  ).run(
    name ?? existing.name,
    city ?? existing.city,
    address !== undefined ? address : existing.address,
    phone !== undefined ? phone : existing.phone,
    description !== undefined ? description : existing.description,
    id
  );
  return findById(id);
}

function remove(id) {
  const info = db.prepare('DELETE FROM stations WHERE id = ?').run(id);
  return info.changes > 0;
}

function isUsedByTrips(id) {
  const row = db
    .prepare('SELECT COUNT(*) AS total FROM trips WHERE from_station_id = ? OR to_station_id = ?')
    .get(id, id);
  return row.total > 0;
}

function count() {
  return db.prepare('SELECT COUNT(*) AS total FROM stations').get().total;
}

module.exports = { findAll, findById, create, update, remove, isUsedByTrips, count };
