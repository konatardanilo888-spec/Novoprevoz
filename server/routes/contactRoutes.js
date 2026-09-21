'use strict';

const { Router } = require('../lib/router');
const contactController = require('../controllers/contactController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { rateLimit } = require('../lib/rateLimit');

const router = new Router();

const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Previše poslatih poruka. Pokušajte kasnije.' });

router.post('/', contactLimiter, contactController.submit);
router.get('/', requireAuth, requireRole('admin', 'superadmin'), contactController.list);
router.put('/:id/read', requireAuth, requireRole('admin', 'superadmin'), contactController.markRead);
router.delete('/:id', requireAuth, requireRole('admin', 'superadmin'), contactController.remove);

module.exports = router;
