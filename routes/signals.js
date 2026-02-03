const express = require('express');
const router = express.Router();
const signalsController = require('../controllers/signalsController');

// GET /api/signals
router.get('/', signalsController.getSignals);

module.exports = router;
