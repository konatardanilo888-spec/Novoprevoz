'use strict';

const notificationModel = require('../models/notificationModel');
const { validate, required, isString, isIn } = require('../lib/validate');

const TYPE_VALUES = ['INFO', 'UPOZORENJE', 'VAZNO'];

const notificationSchema = {
  title: [required('Naslov je obavezan.'), isString({ min: 2, max: 150 })],
  content: [required('Tekst obavještenja je obavezan.'), isString({ min: 2, max: 1000 })],
  type: [isIn(TYPE_VALUES, 'Tip mora biti INFO, UPOZORENJE ili VAZNO.')],
};

function list(req, res) {
  const onlyActive = req.query.active === 'true';
  const notifications = onlyActive ? notificationModel.findActive() : notificationModel.findAll();
  res.json({ notifications });
}

function getOne(req, res) {
  const notification = notificationModel.findById(req.params.id);
  if (!notification) return res.status(404).json({ error: 'Obavještenje nije pronađeno.' });
  res.json({ notification });
}

function create(req, res) {
  const errors = validate(req.body, notificationSchema);
  if (errors.length) return res.status(400).json({ error: 'Neispravni podaci.', errors });
  const notification = notificationModel.create({
    title: String(req.body.title).trim(),
    content: String(req.body.content).trim(),
    type: req.body.type || 'INFO',
    is_active: req.body.is_active !== undefined ? Boolean(req.body.is_active) : true,
  });
  res.status(201).json({ message: 'Obavještenje je uspješno dodato.', notification });
}

function update(req, res) {
  const existing = notificationModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Obavještenje nije pronađeno.' });
  const partialSchema = {};
  for (const key of Object.keys(notificationSchema)) {
    if (req.body[key] !== undefined) partialSchema[key] = notificationSchema[key];
  }
  const errors = validate(req.body, partialSchema);
  if (errors.length) return res.status(400).json({ error: 'Neispravni podaci.', errors });
  const notification = notificationModel.update(req.params.id, {
    ...req.body,
    is_active: req.body.is_active !== undefined ? Boolean(req.body.is_active) : undefined,
  });
  res.json({ message: 'Promjene su uspješno sačuvane.', notification });
}

function remove(req, res) {
  const existing = notificationModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Obavještenje nije pronađeno.' });
  notificationModel.remove(req.params.id);
  res.json({ message: 'Obavještenje je obrisano.' });
}

module.exports = { list, getOne, create, update, remove };
