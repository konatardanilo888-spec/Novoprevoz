'use strict';

const messageModel = require('../models/messageModel');
const { validate, required, isEmail, isString } = require('../lib/validate');

const contactSchema = {
  name: [required('Ime je obavezno.'), isString({ min: 2, max: 100 })],
  email: [required('Email je obavezan.'), isEmail()],
  phone: [isString({ max: 40 })],
  message: [required('Poruka je obavezna.'), isString({ min: 5, max: 2000 })],
};

/**
 * Prima poruku sa kontakt forme. Email servis NIJE povezan (vidi README) -
 * poruka se realno upisuje u bazu i vidljiva je administratoru, a
 * korisniku se iskreno javlja da je zaprimljena, bez lažnog obećanja
 * da je "email poslat".
 */
function submit(req, res) {
  const errors = validate(req.body, contactSchema);
  if (errors.length) return res.status(400).json({ error: 'Neispravni podaci.', errors });

  const message = messageModel.create({
    name: String(req.body.name).trim(),
    email: String(req.body.email).trim().toLowerCase(),
    phone: req.body.phone ? String(req.body.phone).trim() : null,
    message: String(req.body.message).trim(),
  });

  res.status(201).json({
    message:
      'Vaša poruka je zaprimljena i sačuvana. Automatsko slanje na email nije još povezano sa servisom za email, naš tim će je pregledati u administratorskom panelu.',
    id: message.id,
  });
}

function list(req, res) {
  res.json({ messages: messageModel.findAll() });
}

function markRead(req, res) {
  const existing = messageModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Poruka nije pronađena.' });
  const message = messageModel.markRead(req.params.id);
  res.json({ message });
}

function remove(req, res) {
  const existing = messageModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Poruka nije pronađena.' });
  messageModel.remove(req.params.id);
  res.json({ message: 'Poruka je obrisana.' });
}

module.exports = { submit, list, markRead, remove };
