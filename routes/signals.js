const express = require('express');
const router = express.Router();
const signalsController = require('../controllers/signalsController');

// GET /api/signals
router.get('/', signalsController.getSignals);
router.get('/export', signalsController.exportSignals);

module.exports = router;
