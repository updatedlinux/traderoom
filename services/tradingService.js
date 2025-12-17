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
 * @param {number} payoutReal - Payout real de la operación (ej: 0.85 = 85%)
 * @returns {number} PnL (positivo si ITM, negativo si OTM)
 */
function calculatePnL(stake, result, payoutReal) {
  if (result === 'ITM') {
    return stake * payoutReal;
  } else {
    return -stake;
  }
}

/**
 * Calcula el stake para la próxima operación
 * @param {number} currentCapital - Capital actual de la sesión
 * @param {number} riskPerTradePct - Porcentaje de riesgo por operación
 * @param {number} lastStake - Stake de la última operación (si aplica)
 * @param {number} lastMartingaleStep - Paso de martingala de la última operación
 * @param {number} maxMartingaleSteps - Máximo de pasos de martingala permitidos
 * @param {string} lastResult - Resultado de la última operación ('ITM' o 'OTM')
 * @returns {Object} { stake, martingaleStep }
 */
function calculateNextStake(currentCapital, riskPerTradePct, lastStake, lastMartingaleStep, maxMartingaleSteps, lastResult) {
  let stake;
  let martingaleStep = 0;

  console.log('DEBUG calculateNextStake - Parámetros:', {
    currentCapital,
    riskPerTradePct,
    lastStake,
    lastMartingaleStep,
    maxMartingaleSteps,
    lastResult
  });

  // Si la última operación fue OTM y no se alcanzó el límite de martingala
  if (lastResult === 'OTM' && lastMartingaleStep < maxMartingaleSteps) {
    // Aplicar martingala: doble del stake anterior
    martingaleStep = lastMartingaleStep + 1;
    stake = lastStake * 2;
    console.log('DEBUG calculateNextStake - Aplicando martingala:', {
      martingaleStep,
      stake,
      lastStake,
      multiplicador: 2
    });
  } else {
    // Primera operación o después de una ITM: usar stake base
    stake = calculateBaseStake(currentCapital, riskPerTradePct);
    martingaleStep = 0;
    console.log('DEBUG calculateNextStake - Usando stake base:', {
      stake,
      reason: lastResult === 'ITM' ? 'Última operación fue ITM' : 
              lastMartingaleStep >= maxMartingaleSteps ? 'Límite de martingala alcanzado' : 
              'Primera operación'
    });
  }

  // Asegurar que el stake no exceda el capital disponible
  if (stake > currentCapital) {
    stake = currentCapital;
    console.log('DEBUG calculateNextStake - Stake ajustado al capital disponible:', stake);
  }

  return { stake, martingaleStep };
}

/**
 * Obtiene o crea una sesión diaria para un periodo
 * @param {number} periodId - ID del periodo
 * @param {Date} date - Fecha de la sesión (default: hoy en GMT-5)
 * @returns {Promise<DailySession>}
 */
async function getOrCreateDailySession(periodId, date = null) {
  // Obtener fecha actual en GMT-5 (Bogotá)
  let dateStr;
  if (!date) {
    // Obtener fecha actual en zona horaria de Bogotá (GMT-5)
    const now = new Date();
    // Usar toLocaleDateString para obtener la fecha en la zona horaria de Bogotá
    const bogotaDateStr = now.toLocaleDateString('en-CA', { 
      timeZone: 'America/Bogota'
    }); // 'en-CA' devuelve formato YYYY-MM-DD
    dateStr = bogotaDateStr;
  } else {
    // Si se pasa una fecha, formatearla como YYYY-MM-DD
    // Si es un string YYYY-MM-DD, usarlo directamente
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      dateStr = date;
    } else {
      // Si es un objeto Date, formatearlo
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }
  }
  
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
 * @param {number} payoutReal - Payout real de la operación (ej: 0.85 = 85%)
 * @returns {Promise<Object>} Resultado de la operación
 */
async function registerTrade(sessionId, result, currencyPair, payoutReal) {
  if (result !== 'ITM' && result !== 'OTM') {
    throw new Error('Resultado debe ser ITM o OTM');
  }
  
  if (!currencyPair || currencyPair.trim() === '') {
    throw new Error('Par de divisas es requerido');
  }

  if (payoutReal === undefined || payoutReal === null) {
    throw new Error('Payout real es requerido');
  }

  if (payoutReal < 0 || payoutReal > 1) {
    throw new Error('Payout real debe estar entre 0 y 1 (0% a 100%)');
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

  // Verificar que la sesión permita operar
  // Permitir operar si está in_progress o target_hit (con advertencia)
  // NO permitir si está stopped_loss o closed
  if (session.status === 'stopped_loss' || session.status === 'closed') {
    throw new Error(`No se pueden registrar más operaciones. Estado de sesión: ${session.status}`);
  }
  
  // Si es target_hit, se permitirá pero se retornará una advertencia
  const isTargetHit = session.status === 'target_hit';

  const period = session.period;
  const trades = session.trades || [];
  
  // Obtener el último trade para calcular martingala
  const lastTrade = trades.length > 0 ? trades[0] : null;
  
  // Calcular capital actual de la sesión
  let currentCapital = parseFloat(session.starting_capital) + parseFloat(session.daily_pnl);
  
  // Calcular stake para esta operación basado en el estado actual
  let stake;
  let martingaleStep = 0;
  
  if (lastTrade) {
    const stakeCalc = calculateNextStake(
      currentCapital,
      parseFloat(period.risk_per_trade_pct),
      parseFloat(lastTrade.stake),
      lastTrade.martingale_step,
      period.martingale_steps,
      lastTrade.result
    );
    stake = stakeCalc.stake;
    martingaleStep = stakeCalc.martingaleStep;
    
    console.log('DEBUG registerTrade - Cálculo de stake para nueva operación:', {
      lastTradeResult: lastTrade.result,
      lastTradeMartingaleStep: lastTrade.martingale_step,
      lastTradeStake: lastTrade.stake,
      calculatedStake: stake,
      calculatedMartingaleStep: martingaleStep
    });
  } else {
    // Primera operación: usar stake base
    stake = calculateBaseStake(currentCapital, parseFloat(period.risk_per_trade_pct));
    martingaleStep = 0;
    console.log('DEBUG registerTrade - Primera operación, stake base:', stake);
  }

  // El martingaleStep calculado es el paso que se usará para ESTA operación
  // Después de ejecutar esta operación, si es OTM, el siguiente paso sería martingaleStep + 1
  // Pero para guardar en el trade, usamos el martingaleStep calculado (el paso de esta operación)
  
  console.log('DEBUG registerTrade - Martingale step para guardar en trade:', {
    result,
    martingaleStep,
    stake
  });

  // Verificar que el stake no exceda el capital disponible
  if (stake > currentCapital) {
    throw new Error('El stake excede el capital disponible');
  }

  // Calcular PnL usando el payout_real proporcionado
  const pnl = calculatePnL(stake, result, payoutReal);
  
  // Actualizar capital
  currentCapital += pnl;
  
  // Actualizar PnL diario
  const newDailyPnl = parseFloat(session.daily_pnl) + pnl;
  
  // Calcular stops
  const dailyTarget = parseFloat(session.starting_capital) * parseFloat(period.daily_target_pct);
  const maxDailyLoss = parseFloat(session.starting_capital) * parseFloat(period.max_daily_loss_pct);
  
  let newStatus = session.status;
  
  // Verificar si estamos en martingala DESPUÉS de esta operación
  // Si esta operación fue OTM, el siguiente paso de martingala sería martingaleStep
  // Si esta operación fue ITM, salimos de martingala (martingaleStep = 0)
  const willBeInMartingale = result === 'OTM' && martingaleStep > 0 && martingaleStep <= period.martingale_steps;
  const canContinueMartingale = willBeInMartingale && martingaleStep < period.martingale_steps;
  
  if (newDailyPnl >= dailyTarget) {
    newStatus = 'target_hit';
  } else if (newDailyPnl <= -maxDailyLoss) {
    // Solo activar stop loss si:
    // 1. Realmente se alcanzó el límite de pérdida (-6%)
    // 2. Y NO estamos en martingala con pasos disponibles
    // Si estamos en martingala, permitir continuar hasta el último paso
    if (!canContinueMartingale) {
      newStatus = 'stopped_loss';
    }
    // Si estamos en martingala y aún hay pasos, mantener in_progress para permitir continuar
  }

  // Obtener número de trade (usar el máximo trade_number + 1, o contar todos los trades)
  let tradeNumber;
  if (trades.length > 0) {
    // Obtener el máximo trade_number de todos los trades
    const maxTradeNumber = Math.max(...trades.map(t => t.trade_number));
    tradeNumber = maxTradeNumber + 1;
  } else {
    tradeNumber = 1;
  }

  // Crear el trade
  const trade = await Trade.create({
    session_id: sessionId,
    trade_number: tradeNumber,
    stake: stake,
    result: result,
    pnl: pnl,
    capital_after: currentCapital,
    martingale_step: martingaleStep,
    currency_pair: currencyPair.trim().toUpperCase(),
    payout_real: payoutReal
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

  // Calcular el stake para la próxima operación
  // Permitir calcular stake si está in_progress o target_hit (para seguir operando)
  let nextStake = 0;
  let nextMartingaleStep = 0;
  
  if (newStatus === 'in_progress' || newStatus === 'target_hit') {
    const nextStakeCalc = calculateNextStake(
      currentCapital,
      parseFloat(period.risk_per_trade_pct),
      stake,
      martingaleStep,
      period.martingale_steps,
      result
    );
    nextStake = nextStakeCalc.stake;
    nextMartingaleStep = nextStakeCalc.martingaleStep;
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
    canContinue: newStatus === 'in_progress' || newStatus === 'target_hit',
    isTargetHit: newStatus === 'target_hit' && isTargetHit, // Advertencia si ya era target_hit
    nextStake,
    nextMartingaleStep
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
  calculateNextStake,
  getOrCreateDailySession,
  registerTrade,
  closeDailySession
};

