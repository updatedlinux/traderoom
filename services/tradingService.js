const { TradingPeriod, DailySession, Trade } = require('../models');
const { Op } = require('sequelize');

/**
 * Calcula el stake base para una operación
 * @param {number} currentCapital - Capital actual
 * @param {number} riskPerTradePct - Porcentaje de riesgo por operación (ej: 0.05)
 * @returns {number} Stake base
 */
function calculateBaseStake(currentCapital, riskPerTradePct) {
  return currentCapital * riskPerTradePct;
}

/**
 * Calcula el stake usando martingala simple (doble del anterior)
 * @param {number} previousStake - Stake anterior
 * @returns {number} Nuevo stake
 */
function calculateMartingaleStakeSimple(previousStake) {
  return previousStake * 2;
}

/**
 * Calcula el stake usando martingala exacta (basada en pérdidas acumuladas y ganancia deseada)
 * @param {number} accumulatedLosses - Pérdidas acumuladas en la racha actual
 * @param {number} desiredProfit - Ganancia deseada (stake_base * profit_pct)
 * @param {number} profitPct - Porcentaje de payout (ej: 0.80)
 * @returns {number} Nuevo stake
 */
function calculateMartingaleStakeExact(accumulatedLosses, desiredProfit, profitPct) {
  return (accumulatedLosses + desiredProfit) / profitPct;
}

/**
 * Calcula el PnL de una operación
 * @param {number} stake - Monto apostado
 * @param {string} result - 'ITM' o 'OTM'
 * @param {number} profitPct - Porcentaje de payout (ej: 0.80)
 * @returns {number} PnL (positivo si ITM, negativo si OTM)
 */
function calculatePnL(stake, result, profitPct) {
  if (result === 'ITM') {
    return stake * profitPct;
  } else {
    return -stake;
  }
}

/**
 * Obtiene o crea una sesión diaria para un periodo
 * @param {number} periodId - ID del periodo
 * @param {Date} date - Fecha de la sesión (default: hoy en GMT-5)
 * @returns {Promise<DailySession>}
 */
async function getOrCreateDailySession(periodId, date = null) {
  // Obtener fecha actual en GMT-5 (Bogotá)
  if (!date) {
    // Obtener fecha actual en zona horaria de Bogotá (GMT-5)
    const now = new Date();
    const bogotaDateStr = now.toLocaleString('en-US', { 
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    // Convertir formato MM/DD/YYYY a YYYY-MM-DD
    const [month, day, year] = bogotaDateStr.split('/');
    date = new Date(`${year}-${month}-${day}`);
  }
  // Formatear fecha como YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Buscar sesión existente para hoy
  let session = await DailySession.findOne({
    where: {
      period_id: periodId,
      date: dateStr
    }
  });

  if (!session) {
    // Obtener el periodo con sus parámetros
    const period = await TradingPeriod.findByPk(periodId);
    if (!period) {
      throw new Error('Periodo no encontrado');
    }

    // Calcular valores iniciales
    const startingCapital = parseFloat(period.current_capital);
    const dailyTarget = startingCapital * parseFloat(period.daily_target_pct);
    const maxDailyLoss = startingCapital * parseFloat(period.max_daily_loss_pct);

    // Crear nueva sesión
    session = await DailySession.create({
      period_id: periodId,
      date: dateStr,
      starting_capital: startingCapital,
      daily_pnl: 0,
      num_trades: 0,
      status: 'in_progress'
    });
  }

  return session;
}

/**
 * Registra una nueva operación
 * @param {number} sessionId - ID de la sesión
 * @param {string} result - 'ITM' o 'OTM'
 * @param {string} currencyPair - Par de divisas (ej: EUR/USD)
 * @returns {Promise<Object>} Resultado de la operación
 */
async function registerTrade(sessionId, result, currencyPair) {
  if (result !== 'ITM' && result !== 'OTM') {
    throw new Error('Resultado debe ser ITM o OTM');
  }
  
  if (!currencyPair || currencyPair.trim() === '') {
    throw new Error('Par de divisas es requerido');
  }

  // Obtener sesión con periodo y trades
  const session = await DailySession.findByPk(sessionId, {
    include: [{
      model: require('../models').TradingPeriod,
      as: 'period',
      required: true
    }, {
      model: Trade,
      as: 'trades',
      required: false,
      order: [['trade_number', 'DESC']]
    }]
  });

  if (!session) {
    throw new Error('Sesión no encontrada');
  }

  // Verificar que la sesión esté activa
  if (session.status !== 'in_progress') {
    throw new Error(`No se pueden registrar más operaciones. Estado de sesión: ${session.status}`);
  }

  const period = session.period;
  const trades = session.trades || [];
  
  // Obtener el último trade para calcular martingala
  const lastTrade = trades.length > 0 ? trades[0] : null;
  
  // Calcular capital actual
  let currentCapital = parseFloat(session.starting_capital) + parseFloat(session.daily_pnl);
  
  // Calcular stake
  let stake;
  let martingaleStep = 0;
  
  if (lastTrade && lastTrade.result === 'OTM') {
    // Hay una racha de pérdidas, aplicar martingala
    martingaleStep = Math.min(lastTrade.martingale_step + 1, period.martingale_steps);
    
    if (martingaleStep > period.martingale_steps) {
      throw new Error(`Se alcanzó el límite de pasos de martingala (${period.martingale_steps})`);
    }
    
    // Usar martingala simple (doble del stake anterior)
    stake = calculateMartingaleStakeSimple(parseFloat(lastTrade.stake));
    
    // Versión exacta (comentada para uso futuro):
    // const accumulatedLosses = trades
    //   .filter(t => t.result === 'OTM' && t.martingale_step > 0)
    //   .reduce((sum, t) => sum + parseFloat(t.stake), 0);
    // const baseStake = calculateBaseStake(parseFloat(period.initial_capital), parseFloat(period.risk_per_trade_pct));
    // const desiredProfit = baseStake * parseFloat(period.profit_pct);
    // stake = calculateMartingaleStakeExact(accumulatedLosses, desiredProfit, parseFloat(period.profit_pct));
  } else {
    // Primera operación o después de una ITM, usar stake base
    stake = calculateBaseStake(currentCapital, parseFloat(period.risk_per_trade_pct));
    martingaleStep = 0;
  }

  // Verificar que el stake no exceda el capital disponible
  if (stake > currentCapital) {
    throw new Error('El stake excede el capital disponible');
  }

  // Calcular PnL
  const pnl = calculatePnL(stake, result, parseFloat(period.profit_pct));
  
  // Actualizar capital
  currentCapital += pnl;
  
  // Actualizar PnL diario
  const newDailyPnl = parseFloat(session.daily_pnl) + pnl;
  
  // Calcular stops
  const dailyTarget = parseFloat(session.starting_capital) * parseFloat(period.daily_target_pct);
  const maxDailyLoss = parseFloat(session.starting_capital) * parseFloat(period.max_daily_loss_pct);
  
  let newStatus = session.status;
  
  if (newDailyPnl >= dailyTarget) {
    newStatus = 'target_hit';
  } else if (newDailyPnl <= -maxDailyLoss) {
    newStatus = 'stopped_loss';
  }

  // Obtener número de trade
  const tradeNumber = trades.length > 0 ? trades[0].trade_number + 1 : 1;

  // Crear el trade
  const trade = await Trade.create({
    session_id: sessionId,
    trade_number: tradeNumber,
    stake: stake,
    result: result,
    pnl: pnl,
    capital_after: currentCapital,
    martingale_step: martingaleStep,
    currency_pair: currencyPair.trim().toUpperCase()
  });

  // Actualizar sesión
  session.daily_pnl = newDailyPnl;
  session.num_trades = tradeNumber;
  session.status = newStatus;
  await session.save();

  // Si la sesión terminó (target o stop), actualizar el capital del periodo
  if (newStatus === 'target_hit' || newStatus === 'stopped_loss' || newStatus === 'closed') {
    period.current_capital = currentCapital;
    await period.save();
  }

  return {
    trade,
    session: {
      ...session.toJSON(),
      daily_pnl: newDailyPnl,
      num_trades: tradeNumber,
      status: newStatus
    },
    currentCapital,
    dailyTarget,
    maxDailyLoss,
    canContinue: newStatus === 'in_progress'
  };
}

/**
 * Cierra una sesión diaria
 * @param {number} sessionId - ID de la sesión
 * @returns {Promise<DailySession>}
 */
async function closeDailySession(sessionId) {
  const session = await DailySession.findByPk(sessionId, {
    include: [{
      model: require('../models').TradingPeriod,
      as: 'period'
    }]
  });

  if (!session) {
    throw new Error('Sesión no encontrada');
  }

  if (session.status === 'closed') {
    throw new Error('La sesión ya está cerrada');
  }

  // Calcular capital final
  const endingCapital = parseFloat(session.starting_capital) + parseFloat(session.daily_pnl);
  
  session.ending_capital = endingCapital;
  session.status = 'closed';
  await session.save();

  // Actualizar capital del periodo
  const period = session.period;
  period.current_capital = endingCapital;
  await period.save();

  return session;
}

module.exports = {
  calculateBaseStake,
  calculateMartingaleStakeSimple,
  calculateMartingaleStakeExact,
  calculatePnL,
  getOrCreateDailySession,
  registerTrade,
  closeDailySession
};

