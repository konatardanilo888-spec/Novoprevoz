'use strict';

const db = require('../database');

const SELECT_WITH_STATIONS = `
  SELECT
    trips.*,
    fs.name AS from_station_name, fs.city AS from_city,
    ts.name AS to_station_name,   ts.city AS to_city
  FROM trips
  JOIN stations fs ON fs.id = trips.from_station_id
  JOIN stations ts ON ts.id = trips.to_station_id
`;

function findById(id) {
  return db.prepare(`${SELECT_WITH_STATIONS} WHERE trips.id = ?`).get(id);
}

/**
 * Pretražuje vožnje po opcionim filterima: from (city ili station id),
 * to, date, time (minimalno vrijeme polaska), status.
 * Rezultati su sortirani po datumu pa vremenu polaska.
 */
function search({ from, to, date, time, status } = {}) {
  const clauses = [];
  const params = [];

  if (from) {
    clauses.push('(fs.city = ? OR fs.id = ?)');
    params.push(from, Number(from) || -1);
  }
  if (to) {
    clauses.push('(ts.city = ? OR ts.id = ?)');
    params.push(to, Number(to) || -1);
  }
  if (date) {
    clauses.push('trips.departure_date = ?');
    params.push(date);
  }
  if (time) {
    clauses.push('trips.departure_time >= ?');
    params.push(time);
  }
  if (status) {
    clauses.push('trips.status = ?');
    params.push(status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `${SELECT_WITH_STATIONS} ${where} ORDER BY trips.departure_date ASC, trips.departure_time ASC`;
  return db.prepare(sql).all(...params);
}

function findAll() {
  return search({});
}

function create(data) {
  const info = db
    .prepare(
      `INSERT INTO trips
        (route_number, from_station_id, to_station_id, departure_date, departure_time,
         arrival_time, price, bus_type, status, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))`
    )
    .run(
      data.route_number,
      data.from_station_id,
      data.to_station_id,
      data.departure_date,
      data.departure_time,
      data.arrival_time,
      data.price,
      data.bus_type || 'Standardni',
      data.status || 'AKTIVNA',
      data.notes || null
    );
  return findById(Number(info.lastInsertRowid));
}

function update(id, data) {
  const existing = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
  if (!existing) return null;
  db.prepare(
    `UPDATE trips SET
      route_number = ?, from_station_id = ?, to_station_id = ?, departure_date = ?,
      departure_time = ?, arrival_time = ?, price = ?, bus_type = ?, status = ?,
      notes = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
     WHERE id = ?`
  ).run(
    data.route_number ?? existing.route_number,
    data.from_station_id ?? existing.from_station_id,
    data.to_station_id ?? existing.to_station_id,
    data.departure_date ?? existing.departure_date,
    data.departure_time ?? existing.departure_time,
    data.arrival_time ?? existing.arrival_time,
    data.price ?? existing.price,
    data.bus_type ?? existing.bus_type,
    data.status ?? existing.status,
    data.notes !== undefined ? data.notes : existing.notes,
    id
  );
  return findById(id);
}

/** Vožnje se nikad ne brišu fizički ako su OTKAZANE (zahtjev iz specifikacije). */
function remove(id) {
  const trip = db.prepare('SELECT status FROM trips WHERE id = ?').get(id);
  if (!trip) return { deleted: false, reason: 'NOT_FOUND' };
  if (trip.status === 'OTKAZANA') {
    return { deleted: false, reason: 'CANCELLED_PROTECTED' };
  }
  const info = db.prepare('DELETE FROM trips WHERE id = ?').run(id);
  return { deleted: info.changes > 0 };
}

function stats() {
  const totalTrips = db.prepare('SELECT COUNT(*) AS n FROM trips').get().n;
  const today = new Date().toISOString().slice(0, 10);
  const todayDepartures = db
    .prepare("SELECT COUNT(*) AS n FROM trips WHERE departure_date = ? AND status != 'OTKAZANA'")
    .get(today).n;
  const activeLines = db
    .prepare("SELECT COUNT(DISTINCT route_number) AS n FROM trips WHERE status = 'AKTIVNA'")
    .get().n;
  const cancelledTrips = db
    .prepare("SELECT COUNT(*) AS n FROM trips WHERE status = 'OTKAZANA'")
    .get().n;
  return { totalTrips, todayDepartures, activeLines, cancelledTrips };
}

function recent(limit = 5) {
  return db
    .prepare(`${SELECT_WITH_STATIONS} ORDER BY trips.created_at DESC LIMIT ?`)
    .all(limit);
}

function upcoming(limit = 5) {
  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toISOString().slice(11, 16);
  return db
    .prepare(
      `${SELECT_WITH_STATIONS}
       WHERE trips.status = 'AKTIVNA'
         AND (trips.departure_date > ? OR (trips.departure_date = ? AND trips.departure_time >= ?))
       ORDER BY trips.departure_date ASC, trips.departure_time ASC
       LIMIT ?`
    )
    .all(today, today, nowTime, limit);
}

function todayList() {
  const today = new Date().toISOString().slice(0, 10);
  return db
    .prepare(`${SELECT_WITH_STATIONS} WHERE trips.departure_date = ? ORDER BY trips.departure_time ASC`)
    .all(today);
}

function cancelledList(limit = 10) {
  return db
    .prepare(`${SELECT_WITH_STATIONS} WHERE trips.status = 'OTKAZANA' ORDER BY trips.departure_date DESC LIMIT ?`)
    .all(limit);
}

module.exports = {
  findById,
  findAll,
  search,
  create,
  update,
  remove,
  stats,
  recent,
  upcoming,
  todayList,
  cancelledList,
};
