'use strict';

const { Router } = require('../lib/router');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { rateLimit } = require('../lib/rateLimit');

const router = new Router();

// Strožiji rate limit na login (zaštita od brute-force napada).
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: 'Previše pokušaja prijave. Pokušajte ponovo za 15 minuta.' });

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);
router.post('/change-password', requireAuth, authController.changePassword);

module.exports = router;
