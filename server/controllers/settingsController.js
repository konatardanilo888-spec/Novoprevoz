'use strict';

const settingsModel = require('../models/settingsModel');
const { isString } = require('../lib/validate');

function get(req, res) {
  res.json({ settings: settingsModel.getAll() });
}

function update(req, res) {
  const allowedKeys = Object.keys(settingsModel.DEFAULTS);
  const entries = {};
  const errors = [];
  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      const msg = isString({ max: 300 })(req.body[key]);
      if (msg) {
        errors.push({ field: key, message: msg });
      } else {
        entries[key] = String(req.body[key]).trim();
      }
    }
  }
  if (errors.length) return res.status(400).json({ error: 'Neispravni podaci.', errors });
  const settings = settingsModel.setMany(entries);
  res.json({ message: 'Podešavanja su uspješno sačuvana.', settings });
}

module.exports = { get, update };
