'use strict';

const { Router } = require('../lib/router');
const tripController = require('../controllers/tripController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = new Router();

// Javne rute - pretraga i pregled voznog reda ne zahtijevaju prijavu.
router.get('/', tripController.list);
router.get('/dashboard-stats', requireAuth, requireRole('admin', 'superadmin', 'editor'), tripController.dashboardStats);
router.get('/:id', tripController.getOne);

// Administratorske rute - zaštićene autentifikacijom.
router.post('/', requireAuth, requireRole('admin', 'superadmin', 'editor'), tripController.create);
router.put('/:id', requireAuth, requireRole('admin', 'superadmin', 'editor'), tripController.update);
router.delete('/:id', requireAuth, requireRole('admin', 'superadmin'), tripController.remove);

module.exports = router;
