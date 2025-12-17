const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Rutas para traders
router.get('/trader', requireAuth, requireRole('trader'), statisticsController.getTraderStatistics);
router.get('/trader/sessions/:id/excel', requireAuth, requireRole('trader'), statisticsController.generateSessionExcel);

// Rutas para admin - Agregar logs antes de los middlewares
router.get('/admin', (req, res, next) => {
  console.log('DEBUG /admin - Request recibido:', {
    hasSession: !!req.session,
    sessionId: req.session?.id,
    userId: req.session?.userId,
    role: req.session?.role,
    cookies: req.headers.cookie,
    origin: req.headers.origin,
    referer: req.headers.referer
  });
  next();
}, requireAuth, requireRole('admin'), statisticsController.getAdminStatistics);
router.get('/admin/users/:userId', requireAuth, requireRole('admin'), statisticsController.getUserDetails);

module.exports = router;

