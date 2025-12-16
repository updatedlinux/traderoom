const { TradingPeriod, DailySession, Trade } = require('../models');
const tradingService = require('../services/tradingService');
const { Op } = require('sequelize');

const getPeriods = async (req, res) => {
  try {
    const userId = req.session.userId;

    const periods = await TradingPeriod.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      periods
    });
  } catch (error) {
    console.error('Error al obtener periodos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener periodos'
    });
  }
};

const createPeriod = async (req, res) => {
  try {
    const userId = req.session.userId;
    const {
      start_date,
      end_date,
      initial_capital,
      daily_target_pct = 0.15,
      profit_pct = 0.80,
      risk_per_trade_pct = 0.05,
      martingale_steps = 3,
      max_daily_loss_pct = 0.06
    } = req.body;

    if (!start_date || !end_date || !initial_capital) {
      return res.status(400).json({
        success: false,
        error: 'Fecha de inicio, fecha de fin y capital inicial son requeridos'
      });
    }

    const period = await TradingPeriod.create({
      user_id: userId,
      start_date,
      end_date,
      initial_capital: parseFloat(initial_capital),
      current_capital: parseFloat(initial_capital),
      daily_target_pct: parseFloat(daily_target_pct),
      profit_pct: parseFloat(profit_pct),
      risk_per_trade_pct: parseFloat(risk_per_trade_pct),
      martingale_steps: parseInt(martingale_steps),
      max_daily_loss_pct: parseFloat(max_daily_loss_pct),
      status: 'active'
    });

    res.status(201).json({
      success: true,
      period
    });
  } catch (error) {
    console.error('Error al crear periodo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear periodo'
    });
  }
};

const getPeriod = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    const period = await TradingPeriod.findOne({
      where: {
        id,
        user_id: userId
      },
      include: [{
        model: DailySession,
        as: 'sessions',
        include: [{
          model: Trade,
          as: 'trades',
          order: [['trade_number', 'ASC']]
        }],
        order: [['date', 'DESC']]
      }]
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        error: 'Periodo no encontrado'
      });
    }

    res.json({
      success: true,
      period
    });
  } catch (error) {
    console.error('Error al obtener periodo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener periodo'
    });
  }
};

const createSession = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id: periodId } = req.params;

    // Verificar que el periodo pertenece al usuario
    const period = await TradingPeriod.findOne({
      where: {
        id: periodId,
        user_id: userId
      }
    });

    if (!period) {
      return res.status(404).json({
        success: false,
        error: 'Periodo no encontrado'
      });
    }

    if (period.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'El periodo no está activo'
      });
    }

    const session = await tradingService.getOrCreateDailySession(periodId);

    // Calcular valores para la respuesta
    const dailyTarget = parseFloat(session.starting_capital) * parseFloat(period.daily_target_pct);
    const maxDailyLoss = parseFloat(session.starting_capital) * parseFloat(period.max_daily_loss_pct);

    res.json({
      success: true,
      session: {
        ...session.toJSON(),
        dailyTarget,
        maxDailyLoss,
        period: {
          profit_pct: period.profit_pct,
          risk_per_trade_pct: period.risk_per_trade_pct,
          martingale_steps: period.martingale_steps
        }
      }
    });
  } catch (error) {
    console.error('Error al crear sesión:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al crear sesión'
    });
  }
};

const getSession = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    const session = await DailySession.findByPk(id, {
      include: [{
        model: TradingPeriod,
        as: 'period',
        where: { user_id: userId },
        required: true
      }, {
        model: Trade,
        as: 'trades',
        order: [['trade_number', 'ASC']]
      }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    const period = session.period;
    const dailyTarget = parseFloat(session.starting_capital) * parseFloat(period.daily_target_pct);
    const maxDailyLoss = parseFloat(session.starting_capital) * parseFloat(period.max_daily_loss_pct);
    const currentCapital = parseFloat(session.starting_capital) + parseFloat(session.daily_pnl);

    res.json({
      success: true,
      session: {
        ...session.toJSON(),
        currentCapital,
        dailyTarget,
        maxDailyLoss,
        period: {
          profit_pct: period.profit_pct,
          risk_per_trade_pct: period.risk_per_trade_pct,
          martingale_steps: period.martingale_steps
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener sesión:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener sesión'
    });
  }
};

const registerTrade = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id: sessionId } = req.params;
    const { result, currency_pair } = req.body;

    if (!result || (result !== 'ITM' && result !== 'OTM')) {
      return res.status(400).json({
        success: false,
        error: 'Resultado debe ser ITM o OTM'
      });
    }

    if (!currency_pair || currency_pair.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Par de divisas es requerido'
      });
    }

    // Verificar que la sesión pertenece al usuario
    const session = await DailySession.findByPk(sessionId, {
      include: [{
        model: TradingPeriod,
        as: 'period',
        where: { user_id: userId },
        required: true
      }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    const tradeResult = await tradingService.registerTrade(sessionId, result, currency_pair);

    res.json({
      success: true,
      ...tradeResult
    });
  } catch (error) {
    console.error('Error al registrar operación:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al registrar operación'
    });
  }
};

const closeSession = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id: sessionId } = req.params;

    // Verificar que la sesión pertenece al usuario
    const session = await DailySession.findByPk(sessionId, {
      include: [{
        model: TradingPeriod,
        as: 'period',
        where: { user_id: userId },
        required: true
      }]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    const closedSession = await tradingService.closeDailySession(sessionId);

    res.json({
      success: true,
      session: closedSession
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al cerrar sesión'
    });
  }
};

module.exports = {
  getPeriods,
  createPeriod,
  getPeriod,
  createSession,
  getSession,
  registerTrade,
  closeSession
};

