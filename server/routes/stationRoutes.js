'use strict';

const { Router } = require('../lib/router');
const stationController = require('../controllers/stationController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = new Router();

router.get('/', stationController.list);
router.get('/:id', stationController.getOne);

router.post('/', requireAuth, requireRole('admin', 'superadmin'), stationController.create);
router.put('/:id', requireAuth, requireRole('admin', 'superadmin'), stationController.update);
router.delete('/:id', requireAuth, requireRole('admin', 'superadmin'), stationController.remove);

module.exports = router;
