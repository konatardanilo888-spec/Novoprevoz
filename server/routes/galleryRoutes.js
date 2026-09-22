'use strict';

const { Router } = require('../lib/router');
const galleryController = require('../controllers/galleryController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = new Router();

router.get('/', galleryController.list);
router.post('/', requireAuth, requireRole('admin', 'superadmin'), galleryController.create);
router.delete('/:id', requireAuth, requireRole('admin', 'superadmin'), galleryController.remove);

module.exports = router;
