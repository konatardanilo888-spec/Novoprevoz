'use strict';

/**
 * Rute za serviranje HTML stranica ("pretty URLs" bez .html ekstenzije).
 * Admin stranice (osim login-a) su zaštićene server-side provjerom
 * kolačića - ako korisnik nije prijavljen, biva preusmjeren na
 * /admin/login prije nego što HTML uopšte stigne do njega.
 */

const path = require('node:path');
const { Router } = require('./lib/router');
const config = require('./config');
const { requirePageAuth } = require('./middleware/auth');

const router = new Router();

function servePublic(fileName) {
  return (req, res, next) => {
    res.sendFile(path.join(config.publicDir, fileName)).catch(next);
  };
}

function serveAdmin(fileName) {
  return (req, res, next) => {
    res.sendFile(path.join(config.adminDir, fileName)).catch(next);
  };
}

// ---------- Javne stranice ----------
router.get('/', servePublic('index.html'));
router.get('/vozni-red', servePublic('vozni-red.html'));
router.get('/polasci', servePublic('polasci.html'));
router.get('/voznja', servePublic('voznja.html'));
router.get('/o-nama', servePublic('o-nama.html'));
router.get('/kontakt', servePublic('kontakt.html'));
router.get('/galerija', servePublic('galerija.html'));

// ---------- Admin stranice ----------
router.get('/admin', (req, res) => res.redirect('/admin/dashboard'));
router.get('/admin/login', serveAdmin('login.html'));
router.get('/admin/dashboard', requirePageAuth, serveAdmin('dashboard.html'));
router.get('/admin/trips', requirePageAuth, serveAdmin('trips.html'));
router.get('/admin/trips/new', requirePageAuth, serveAdmin('trip-form.html'));
router.get('/admin/trips/:id/edit', requirePageAuth, serveAdmin('trip-form.html'));
router.get('/admin/stations', requirePageAuth, serveAdmin('stations.html'));
router.get('/admin/notifications', requirePageAuth, serveAdmin('notifications.html'));
router.get('/admin/gallery', requirePageAuth, serveAdmin('gallery.html'));
router.get('/admin/users', requirePageAuth, serveAdmin('users.html'));
router.get('/admin/messages', requirePageAuth, serveAdmin('messages.html'));
router.get('/admin/settings', requirePageAuth, serveAdmin('settings.html'));

module.exports = router;
