const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Rutas para traders
router.get('/trader', requireAuth, requireRole('trader'), statisticsController.getTraderStatistics);
router.get('/trader/sessions/:id/pdf', requireAuth, requireRole('trader'), statisticsController.generateSessionPDF);

// Rutas para admin
router.get('/admin', requireAuth, requireRole('admin'), statisticsController.getAdminStatistics);
router.get('/admin/users/:userId', requireAuth, requireRole('admin'), statisticsController.getUserDetails);

module.exports = router;

