/**
 * Script de prueba para verificar la lógica de cierre automático de sesiones stale
 */
require('dotenv').config();
const { TradingPeriod, DailySession, Trade } = require('../models');
const { createDailySessionsForActivePeriods } = require('../services/dailySessionScheduler');
const { closeDailySession } = require('../services/tradingService');

async function testAutoClose() {
    try {
        console.log('--- INICIANDO PRUEBA DE CIERRE AUTOMÁTICO ---');

        // 1. Crear un periodo de prueba
        const period = await TradingPeriod.create({
            user_id: 1, // Asumiendo que el usuario ID 1 existe
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            initial_capital: 1000,
            current_capital: 1000,
            daily_target_pct: 0.05,
            max_daily_loss_pct: 0.05,
            status: 'active',
            nickname: 'Test Auto-Close'
        });

        console.log('✓ Periodo de prueba creado ID:', period.id);

        // 2. Crear una sesión "stale" (ayer)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

        const staleSession = await DailySession.create({
            period_id: period.id,
            date: yesterdayStr,
            starting_capital: 1000,
            status: 'in_progress', // Debe ser cerrada por el scheduler
            num_trades: 2,
            daily_pnl: 50 // Un profit ficticio
        });

        console.log(`✓ Sesión "stale" creada para la fecha ${yesterdayStr}, ID: ${staleSession.id}`);

        // 3. Ejecutar el scheduler (que llama a closePreviousStaleSessions)
        console.log('Ejecutando scheduler...');
        await createDailySessionsForActivePeriods();

        // 4. Verificar resultados
        const updatedSession = await DailySession.findByPk(staleSession.id);
        const updatedPeriod = await TradingPeriod.findByPk(period.id);

        console.log('--- RESULTADOS ---');
        console.log('Estado final de la sesión:', updatedSession.status);
        console.log('Capital final de la sesión:', updatedSession.ending_capital);
        console.log('Capital actual del periodo:', updatedPeriod.current_capital);

        if (updatedSession.status === 'closed' && parseFloat(updatedSession.ending_capital) === 1050) {
            console.log('✅ PRUEBA EXITOSA: La sesión se cerró y actualizó el capital correctamente.');
        } else {
            console.log('❌ PRUEBA FALLIDA: Verifica los logs anteriores.');
        }

        // Limpieza (opcional)
        // await period.destroy(); // Esto debería eliminar sesiones en cascada si está configurado

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    } finally {
        process.exit();
    }
}

testAutoClose();
