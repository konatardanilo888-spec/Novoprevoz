'use strict';

const userModel = require('../models/userModel');
const { hashPassword } = require('../lib/password');
const { validate, required, isEmail, isString, isIn } = require('../lib/validate');

const ROLE_VALUES = ['admin', 'superadmin', 'editor'];

function list(req, res) {
  res.json({ users: userModel.findAll() });
}

function create(req, res) {
  const errors = validate(req.body, {
    name: [required('Ime je obavezno.'), isString({ min: 2, max: 100 })],
    email: [required('Email je obavezan.'), isEmail()],
    password: [required('Lozinka je obavezna.'), isString({ min: 8 }, 'Lozinka mora imati bar 8 karaktera.')],
    role: [isIn(ROLE_VALUES, 'Rola mora biti admin, superadmin ili editor.')],
  });
  if (errors.length) return res.status(400).json({ error: 'Neispravni podaci.', errors });

  const email = String(req.body.email).trim().toLowerCase();
  if (userModel.findByEmail(email)) {
    return res.status(409).json({ error: 'Korisnik sa ovim emailom već postoji.' });
  }

  const user = userModel.create({
    name: String(req.body.name).trim(),
    email,
    passwordHash: hashPassword(req.body.password),
    role: req.body.role || 'admin',
  });
  res.status(201).json({ message: 'Korisnik je uspješno dodat.', user });
}

function update(req, res) {
  const existing = userModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Korisnik nije pronađen.' });

  if (req.body.role && !ROLE_VALUES.includes(req.body.role)) {
    return res.status(400).json({
      error: 'Neispravni podaci.',
      errors: [{ field: 'role', message: 'Rola mora biti admin, superadmin ili editor.' }],
    });
  }
  // Superadmin ne smije sam sebi ukinuti pristup slučajnom deaktivacijom
  // posljednjeg aktivnog superadmina - jednostavna zaštitna provjera.
  if (existing.role === 'superadmin' && req.body.is_active === false) {
    const activeSuperadmins = userModel
      .findAll()
      .filter((u) => u.role === 'superadmin' && u.is_active).length;
    if (activeSuperadmins <= 1) {
      return res.status(409).json({ error: 'Mora postojati bar jedan aktivan superadmin nalog.' });
    }
  }

  const user = userModel.update(req.params.id, req.body);
  res.json({ message: 'Promjene su uspješno sačuvane.', user });
}

function remove(req, res) {
  const existing = userModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Korisnik nije pronađen.' });
  if (existing.id === req.user.id) {
    return res.status(400).json({ error: 'Ne možete obrisati sopstveni nalog.' });
  }
  userModel.remove(req.params.id);
  res.json({ message: 'Korisnik je obrisan.' });
}

module.exports = { list, create, update, remove };
