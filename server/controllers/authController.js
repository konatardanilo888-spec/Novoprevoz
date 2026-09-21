'use strict';

const userModel = require('../models/userModel');
const { verifyPassword, hashPassword } = require('../lib/password');
const jwt = require('../lib/jwt');
const config = require('../config');
const { validate, required, isEmail, isString } = require('../lib/validate');

function setAuthCookie(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: config.isProduction,
    maxAge: parseExpirySeconds(config.jwtExpiresIn),
  });
}

function parseExpirySeconds(expiresIn) {
  const match = /^(\d+)([smhd])$/.exec(String(expiresIn));
  if (!match) return 3600;
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return parseInt(match[1], 10) * multipliers[match[2]];
}

async function login(req, res) {
  const errors = validate(req.body, {
    email: [required('Email je obavezan.'), isEmail()],
    password: [required('Lozinka je obavezna.')],
  });
  if (errors.length) {
    return res.status(400).json({ error: 'Neispravni podaci.', errors });
  }

  const { email, password } = req.body;
  const user = userModel.findByEmail(String(email).trim().toLowerCase());

  // Namjerno ista poruka za "ne postoji" i "pogrešna lozinka" - ne otkrivamo
  // napadaču da li email postoji u sistemu.
  const invalidMessage = 'Pogrešan email ili lozinka.';

  if (!user) {
    return res.status(401).json({ error: invalidMessage });
  }
  if (!user.is_active) {
    return res.status(403).json({ error: 'Nalog je deaktiviran. Obratite se administratoru.' });
  }
  const passwordOk = verifyPassword(password, user.password_hash);
  if (!passwordOk) {
    return res.status(401).json({ error: invalidMessage });
  }

  setAuthCookie(res, user);
  return res.json({
    message: 'Uspješno ste prijavljeni.',
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

function logout(req, res) {
  res.clearCookie(config.cookieName);
  return res.json({ message: 'Uspješno ste odjavljeni.' });
}

function me(req, res) {
  return res.json({ user: req.user });
}

async function changePassword(req, res) {
  const errors = validate(req.body, {
    currentPassword: [required('Trenutna lozinka je obavezna.')],
    newPassword: [required('Nova lozinka je obavezna.'), isString({ min: 8 }, 'Nova lozinka mora imati bar 8 karaktera.')],
  });
  if (errors.length) {
    return res.status(400).json({ error: 'Neispravni podaci.', errors });
  }
  const fullUser = userModel.findByEmail(req.user.email);
  const ok = verifyPassword(req.body.currentPassword, fullUser.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Trenutna lozinka nije ispravna.' });
  }
  userModel.updatePassword(req.user.id, hashPassword(req.body.newPassword));
  return res.json({ message: 'Lozinka je uspješno promijenjena.' });
}

module.exports = { login, logout, me, changePassword };
