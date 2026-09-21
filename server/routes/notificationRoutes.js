'use strict';

const { Router } = require('../lib/router');
const notificationController = require('../controllers/notificationController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = new Router();

router.get('/', notificationController.list);
router.get('/:id', notificationController.getOne);

router.post('/', requireAuth, requireRole('admin', 'superadmin'), notificationController.create);
router.put('/:id', requireAuth, requireRole('admin', 'superadmin'), notificationController.update);
router.delete('/:id', requireAuth, requireRole('admin', 'superadmin'), notificationController.remove);

module.exports = router;
