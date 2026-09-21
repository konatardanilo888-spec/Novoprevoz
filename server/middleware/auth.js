'use strict';

/**
 * Middleware za autentifikaciju i autorizaciju admin korisnika.
 * Token se čita iz httpOnly kolačića (ne iz localStorage - da bi bio
 * nedostupan klijentskom JavaScript-u i otporniji na XSS).
 */

const jwt = require('../lib/jwt');
const config = require('../config');
const userModel = require('../models/userModel');

/** Zahtijeva validan JWT token; u suprotnom vraća 401. */
function requireAuth(req, res, next) {
  const token = req.cookies[config.cookieName];
  if (!token) {
    return res.status(401).json({ error: 'Niste prijavljeni.' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = userModel.findById(payload.sub);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Nalog ne postoji ili je deaktiviran.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesija je istekla. Prijavite se ponovo.' });
  }
}

/** Zahtijeva da ulogovani korisnik ima jednu od dozvoljenih rola. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Niste prijavljeni.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Nemate dozvolu za ovu akciju.' });
    }
    next();
  };
}

/**
 * "Meki" auth middleware za HTML admin stranice: ako token nije validan,
 * preusmjerava na login stranicu umjesto da vrati JSON 401 (koristi se
 * samo pri serviranju admin HTML fajlova, ne za API rute).
 */
function requirePageAuth(req, res, next) {
  const token = req.cookies[config.cookieName];
  if (!token) {
    return res.redirect('/admin/login');
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = userModel.findById(payload.sub);
    if (!user || !user.is_active) {
      return res.redirect('/admin/login');
    }
    req.user = user;
    next();
  } catch {
    return res.redirect('/admin/login');
  }
}

module.exports = { requireAuth, requireRole, requirePageAuth };
