const express = require('express');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const contactsRoutes = require('./routes/contacts');
const schedulesRoutes = require('./routes/schedules');
const logsRoutes = require('./routes/logs');
const whatsappRoutes = require('./routes/whatsapp');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/contacts', contactsRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/logs', logsRoutes);
router.use('/whatsapp', whatsappRoutes);

module.exports = router;
