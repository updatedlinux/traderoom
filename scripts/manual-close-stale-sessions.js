/**
 * Script de mantenimiento para cerrar sesiones antiguas que quedaron abiertas
 * Uso: node scripts/manual-close-stale-sessions.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { TradingPeriod, DailySession } = require('../models');
const { closeDailySession } = require('../services/tradingService');
const { Op } = require('sequelize');

async function run() {
    try {
        console.log('--- INICIANDO CIERRE MANUAL DE SESIONES ANTIGUAS ---');

        // Obtener fecha actual en GMT-5 (Bogotá)
        const now = new Date();
        const bogotaDateStr = now.toLocaleDateString('en-CA', {
            timeZone: 'America/Bogota'
        });

        console.log(`Fecha actual (Bogotá): ${bogotaDateStr}`);

        // Buscar todas las sesiones con fecha anterior a hoy que no estén cerradas
        const staleSessions = await DailySession.findAll({
            where: {
                date: {
                    [Op.lt]: bogotaDateStr
                },
                status: {
                    [Op.in]: ['in_progress', 'target_hit', 'stopped_loss']
                }
            },
            include: [{ model: TradingPeriod, as: 'period' }]
        });

        console.log(`Se encontraron ${staleSessions.length} sesiones para cerrar.`);

        for (const session of staleSessions) {
            console.log(`Cerrando sesión ID: ${session.id} | Fecha: ${session.date} | Periodo: ${session.period_id} (${session.period?.nickname || 'Sin nombre'})`);
            try {
                await closeDailySession(session.id);
                console.log(`  ✓ Sesión ${session.id} cerrada correctamente.`);
            } catch (err) {
                console.error(`  ✗ Error al cerrar sesión ${session.id}:`, err.message);
            }
        }

        console.log('--- PROCESO COMPLETADO ---');
        process.exit(0);
    } catch (error) {
        console.error('ERROR CRÍTICO:', error);
        process.exit(1);
    }
}

run();
