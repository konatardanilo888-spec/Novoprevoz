'use strict';

const tripModel = require('../models/tripModel');
const stationModel = require('../models/stationModel');
const {
  validate,
  required,
  isInteger,
  isNumber,
  isDate,
  isTime,
  isIn,
  isString,
} = require('../lib/validate');

const STATUS_VALUES = ['AKTIVNA', 'OTKAZANA', 'ZAVRSENA'];

const tripSchema = {
  route_number: [required('Broj linije je obavezan.'), isString({ min: 1, max: 20 })],
  from_station_id: [required('Polazna stanica je obavezna.'), isInteger({ min: 1 })],
  to_station_id: [required('Odredišna stanica je obavezna.'), isInteger({ min: 1 })],
  departure_date: [required('Datum polaska je obavezan.'), isDate()],
  departure_time: [required('Vrijeme polaska je obavezno.'), isTime()],
  arrival_time: [required('Vrijeme dolaska je obavezno.'), isTime()],
  price: [required('Cijena je obavezna.'), isNumber({ min: 0 })],
  bus_type: [isString({ max: 60 })],
  status: [isIn(STATUS_VALUES, 'Status mora biti AKTIVNA, OTKAZANA ili ZAVRSENA.')],
  notes: [isString({ max: 500 })],
};

function serializeTrip(trip) {
  return {
    id: trip.id,
    route_number: trip.route_number,
    from_station_id: trip.from_station_id,
    to_station_id: trip.to_station_id,
    from_station: { id: trip.from_station_id, name: trip.from_station_name, city: trip.from_city },
    to_station: { id: trip.to_station_id, name: trip.to_station_name, city: trip.to_city },
    departure_date: trip.departure_date,
    departure_time: trip.departure_time,
    arrival_time: trip.arrival_time,
    duration_minutes: computeDurationMinutes(trip.departure_time, trip.arrival_time),
    price: trip.price,
    bus_type: trip.bus_type,
    status: trip.status,
    notes: trip.notes,
    created_at: trip.created_at,
    updated_at: trip.updated_at,
  };
}

function computeDurationMinutes(departureTime, arrivalTime) {
  const [dh, dm] = departureTime.split(':').map(Number);
  const [ah, am] = arrivalTime.split(':').map(Number);
  let minutes = ah * 60 + am - (dh * 60 + dm);
  if (minutes < 0) minutes += 24 * 60; // vožnja preko ponoći
  return minutes;
}

function list(req, res) {
  const { from, to, date, time, status } = req.query;
  const trips = tripModel.search({ from, to, date, time, status });
  res.json({ trips: trips.map(serializeTrip) });
}

function getOne(req, res) {
  const trip = tripModel.findById(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Vožnja nije pronađena.' });
  res.json({ trip: serializeTrip(trip) });
}

function validateStationsExist(fromId, toId) {
  const errors = [];
  if (fromId && !stationModel.findById(fromId)) {
    errors.push({ field: 'from_station_id', message: 'Polazna stanica ne postoji.' });
  }
  if (toId && !stationModel.findById(toId)) {
    errors.push({ field: 'to_station_id', message: 'Odredišna stanica ne postoji.' });
  }
  if (fromId && toId && Number(fromId) === Number(toId)) {
    errors.push({ field: 'to_station_id', message: 'Polazna i odredišna stanica moraju biti različite.' });
  }
  return errors;
}

function create(req, res) {
  const errors = validate(req.body, tripSchema);
  errors.push(...validateStationsExist(req.body.from_station_id, req.body.to_station_id));
  if (errors.length) {
    return res.status(400).json({ error: 'Neispravni podaci o vožnji.', errors });
  }
  const trip = tripModel.create({
    route_number: String(req.body.route_number).trim(),
    from_station_id: Number(req.body.from_station_id),
    to_station_id: Number(req.body.to_station_id),
    departure_date: req.body.departure_date,
    departure_time: req.body.departure_time,
    arrival_time: req.body.arrival_time,
    price: Number(req.body.price),
    bus_type: req.body.bus_type ? String(req.body.bus_type).trim() : 'Standardni',
    status: req.body.status || 'AKTIVNA',
    notes: req.body.notes ? String(req.body.notes).trim() : null,
  });
  res.status(201).json({ message: 'Vožnja je uspješno dodata.', trip: serializeTrip(trip) });
}

function update(req, res) {
  const existing = tripModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Vožnja nije pronađena.' });

  // Partial update: validiramo samo polja koja su prisutna u zahtjevu.
  const partialSchema = {};
  for (const key of Object.keys(tripSchema)) {
    if (req.body[key] !== undefined) partialSchema[key] = tripSchema[key];
  }
  const errors = validate(req.body, partialSchema);
  errors.push(
    ...validateStationsExist(
      req.body.from_station_id ?? existing.from_station_id,
      req.body.to_station_id ?? existing.to_station_id
    )
  );
  if (errors.length) {
    return res.status(400).json({ error: 'Neispravni podaci o vožnji.', errors });
  }

  const trip = tripModel.update(req.params.id, {
    route_number: req.body.route_number !== undefined ? String(req.body.route_number).trim() : undefined,
    from_station_id: req.body.from_station_id !== undefined ? Number(req.body.from_station_id) : undefined,
    to_station_id: req.body.to_station_id !== undefined ? Number(req.body.to_station_id) : undefined,
    departure_date: req.body.departure_date,
    departure_time: req.body.departure_time,
    arrival_time: req.body.arrival_time,
    price: req.body.price !== undefined ? Number(req.body.price) : undefined,
    bus_type: req.body.bus_type !== undefined ? String(req.body.bus_type).trim() : undefined,
    status: req.body.status,
    notes: req.body.notes !== undefined ? String(req.body.notes).trim() : undefined,
  });
  res.json({ message: 'Promjene su uspješno sačuvane.', trip: serializeTrip(trip) });
}

function remove(req, res) {
  const result = tripModel.remove(req.params.id);
  if (result.reason === 'NOT_FOUND') {
    return res.status(404).json({ error: 'Vožnja nije pronađena.' });
  }
  if (result.reason === 'CANCELLED_PROTECTED') {
    return res.status(409).json({
      error: 'Otkazana vožnja se ne može trajno obrisati iz baze. Vožnja ostaje vidljiva sa statusom OTKAZANO.',
    });
  }
  res.json({ message: 'Vožnja je obrisana.' });
}

function dashboardStats(req, res) {
  const stats = tripModel.stats();
  const stationsCount = stationModel.count();
  res.json({
    stats: {
      totalTrips: stats.totalTrips,
      todayDepartures: stats.todayDepartures,
      activeLines: stats.activeLines,
      totalStations: stationsCount,
      cancelledTrips: stats.cancelledTrips,
    },
    recentTrips: tripModel.recent(5).map(serializeTrip),
    todayTrips: tripModel.todayList().map(serializeTrip),
    upcomingTrips: tripModel.upcoming(5).map(serializeTrip),
    cancelledTrips: tripModel.cancelledList(5).map(serializeTrip),
  });
}

module.exports = { list, getOne, create, update, remove, dashboardStats, serializeTrip };
