const express = require('express');
const router = express.Router();

/**
 * GET /api/telegram/messages
 * Obtiene los mensajes recientes del buffer de Telegram
 * Query params:
 *   - limit: número de mensajes a retornar (default: 50, max: 200)
 */
router.get('/telegram/messages', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const telegramListener = req.app.get('telegramListener');
    
    if (!telegramListener) {
      return res.status(503).json({ 
        success: false,
        error: 'Telegram listener no está inicializado. Verifica la configuración en .env' 
      });
    }
    
    const messages = telegramListener.getRecentMessages(limit);
    res.json(messages);
  } catch (error) {
    console.error('Error al obtener mensajes de Telegram:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener mensajes de Telegram' 
    });
  }
});

module.exports = router;

