'use strict';

const { Router } = require('../lib/router');
const settingsController = require('../controllers/settingsController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = new Router();

router.get('/', settingsController.get);
router.put('/', requireAuth, requireRole('admin', 'superadmin'), settingsController.update);

module.exports = router;
