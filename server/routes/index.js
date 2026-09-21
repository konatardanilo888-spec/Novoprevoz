'use strict';

const { Router } = require('../lib/router');
const authRoutes = require('./authRoutes');
const tripRoutes = require('./tripRoutes');
const stationRoutes = require('./stationRoutes');
const notificationRoutes = require('./notificationRoutes');
const userRoutes = require('./userRoutes');
const settingsRoutes = require('./settingsRoutes');
const contactRoutes = require('./contactRoutes');

const apiRouter = new Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/trips', tripRoutes);
apiRouter.use('/stations', stationRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/contact', contactRoutes);

module.exports = apiRouter;
