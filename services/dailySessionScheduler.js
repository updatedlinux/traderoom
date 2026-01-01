/**
 * Servicio para crear automáticamente sesiones diarias a las 00:00 GMT-5
 * Este servicio se ejecuta mediante un cron job configurado en server.js
 */

const { TradingPeriod, DailySession } = require('../models');
const { getOrCreateDailySession } = require('./tradingService');

/**
 * Crea sesiones diarias para todos los periodos activos
 * Esta función se ejecuta automáticamente a las 00:00 GMT-5 todos los días
 */
async function createDailySessionsForActivePeriods() {
  try {
    console.log('[SCHEDULER] Iniciando creación automática de sesiones diarias...');
    
    // Obtener fecha actual en GMT-5 (Bogotá)
    const now = new Date();
    const bogotaDateStr = now.toLocaleDateString('en-CA', { 
      timeZone: 'America/Bogota'
    }); // Formato: YYYY-MM-DD
    
    console.log(`[SCHEDULER] Fecha objetivo: ${bogotaDateStr} (GMT-5 Bogotá)`);
    
    // Buscar todos los periodos activos
    const activePeriods = await TradingPeriod.findAll({
      where: {
        status: 'active'
      }
    });
    
    console.log(`[SCHEDULER] Encontrados ${activePeriods.length} periodos activos`);
    
    if (activePeriods.length === 0) {
      console.log('[SCHEDULER] No hay periodos activos. No se crearán sesiones.');
      return;
    }
    
    // Verificar que la fecha esté dentro del rango del periodo
    const today = new Date(bogotaDateStr + 'T00:00:00');
    const validPeriods = activePeriods.filter(period => {
      const startDate = new Date(period.start_date + 'T00:00:00');
      const endDate = new Date(period.end_date + 'T00:00:00');
      return today >= startDate && today <= endDate;
    });
    
    console.log(`[SCHEDULER] ${validPeriods.length} periodos están dentro de su rango de fechas`);
    
    let createdCount = 0;
    let existingCount = 0;
    let errorCount = 0;
    
    // Crear sesión para cada periodo válido
    for (const period of validPeriods) {
      try {
        // Verificar si ya existe una sesión para hoy
        const existingSession = await DailySession.findOne({
          where: {
            period_id: period.id,
            date: bogotaDateStr
          }
        });
        
        if (existingSession) {
          console.log(`[SCHEDULER] Periodo ${period.id} (${period.nickname || 'Sin nombre'}): Sesión del ${bogotaDateStr} ya existe`);
          existingCount++;
          continue;
        }
        
        // Crear sesión usando el servicio existente
        const session = await getOrCreateDailySession(period.id, bogotaDateStr);
        
        console.log(`[SCHEDULER] ✓ Periodo ${period.id} (${period.nickname || 'Sin nombre'}): Sesión creada - ID: ${session.id}, Capital inicial: $${parseFloat(session.starting_capital).toFixed(2)}`);
        createdCount++;
      } catch (error) {
        console.error(`[SCHEDULER] ✗ Error al crear sesión para periodo ${period.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`[SCHEDULER] Resumen: ${createdCount} sesiones creadas, ${existingCount} ya existían, ${errorCount} errores`);
    console.log('[SCHEDULER] Proceso de creación automática completado.');
  } catch (error) {
    console.error('[SCHEDULER] Error crítico en creación automática de sesiones:', error);
  }
}

module.exports = {
  createDailySessionsForActivePeriods
};


