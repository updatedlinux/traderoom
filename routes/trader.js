const express = require('express');
const router = express.Router();
const traderController = require('../controllers/traderController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');

// Todas las rutas requieren autenticación y rol trader
router.use(requireAuth);
router.use(requireRole('trader'));

// Validación para crear periodo
const validateCreatePeriod = [
  body('start_date').isISO8601().withMessage('Fecha de inicio inválida'),
  body('end_date').isISO8601().withMessage('Fecha de fin inválida'),
  body('initial_capital').isFloat({ min: 0 }).withMessage('Capital inicial debe ser un número positivo'),
  body('daily_target_pct').optional().isFloat({ min: 0, max: 1 }).withMessage('Porcentaje de meta diaria debe estar entre 0 y 1'),
  body('profit_pct').optional().isFloat({ min: 0, max: 1 }).withMessage('Porcentaje de ganancia debe estar entre 0 y 1'),
  body('risk_per_trade_pct').optional().isFloat({ min: 0, max: 1 }).withMessage('Porcentaje de riesgo por operación debe estar entre 0 y 1'),
  body('martingale_steps').optional().isInt({ min: 0, max: 10 }).withMessage('Pasos de martingala debe ser un entero entre 0 y 10'),
  body('max_daily_loss_pct').optional().isFloat({ min: 0, max: 1 }).withMessage('Porcentaje de pérdida máxima diaria debe estar entre 0 y 1')
];

// Validación para registrar operación
const validateRegisterTrade = [
  body('result').isIn(['ITM', 'OTM']).withMessage('Resultado debe ser ITM o OTM'),
  body('currency_pair').trim().isLength({ min: 3, max: 20 }).withMessage('Par de divisas es requerido (ej: EUR/USD)')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }
  next();
};

router.get('/periods', traderController.getPeriods);
router.post('/periods', validateCreatePeriod, handleValidationErrors, traderController.createPeriod);
router.get('/periods/:id', traderController.getPeriod);
router.patch('/periods/:id', validateCreatePeriod, handleValidationErrors, traderController.updatePeriod);
router.post('/periods/:id/sessions', traderController.createSession);
router.get('/sessions/:id', traderController.getSession);
router.post('/sessions/:id/trades', validateRegisterTrade, handleValidationErrors, traderController.registerTrade);
router.post('/sessions/:id/close', traderController.closeSession);

module.exports = router;

