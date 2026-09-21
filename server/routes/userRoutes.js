'use strict';

const { Router } = require('../lib/router');
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = new Router();

// Upravljanje korisnicima je rezervisano samo za superadmin rolu.
router.use(requireAuth);
router.use(requireRole('superadmin'));

router.get('/', userController.list);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
