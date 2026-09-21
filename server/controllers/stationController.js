'use strict';

const stationModel = require('../models/stationModel');
const { validate, required, isString } = require('../lib/validate');

const stationSchema = {
  name: [required('Naziv stanice je obavezan.'), isString({ min: 2, max: 120 })],
  city: [required('Grad je obavezan.'), isString({ min: 2, max: 60 })],
  address: [isString({ max: 200 })],
  phone: [isString({ max: 40 })],
  description: [isString({ max: 500 })],
};

function list(req, res) {
  res.json({ stations: stationModel.findAll() });
}

function getOne(req, res) {
  const station = stationModel.findById(req.params.id);
  if (!station) return res.status(404).json({ error: 'Stanica nije pronađena.' });
  res.json({ station });
}

function create(req, res) {
  const errors = validate(req.body, stationSchema);
  if (errors.length) return res.status(400).json({ error: 'Neispravni podaci o stanici.', errors });
  const station = stationModel.create({
    name: String(req.body.name).trim(),
    city: String(req.body.city).trim(),
    address: req.body.address ? String(req.body.address).trim() : null,
    phone: req.body.phone ? String(req.body.phone).trim() : null,
    description: req.body.description ? String(req.body.description).trim() : null,
  });
  res.status(201).json({ message: 'Stanica je uspješno dodata.', station });
}

function update(req, res) {
  const existing = stationModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Stanica nije pronađena.' });
  const partialSchema = {};
  for (const key of Object.keys(stationSchema)) {
    if (req.body[key] !== undefined) partialSchema[key] = stationSchema[key];
  }
  const errors = validate(req.body, partialSchema);
  if (errors.length) return res.status(400).json({ error: 'Neispravni podaci o stanici.', errors });
  const station = stationModel.update(req.params.id, req.body);
  res.json({ message: 'Promjene su uspješno sačuvane.', station });
}

function remove(req, res) {
  const existing = stationModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Stanica nije pronađena.' });
  if (stationModel.isUsedByTrips(req.params.id)) {
    return res.status(409).json({
      error: 'Stanica se ne može obrisati jer se koristi u postojećim vožnjama.',
    });
  }
  stationModel.remove(req.params.id);
  res.json({ message: 'Stanica je obrisana.' });
}

module.exports = { list, getOne, create, update, remove };
