const { TradingPeriod, DailySession, Trade, User } = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Obtiene estadísticas de sesiones cerradas para un trader
 */
const getTraderStatistics = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Obtener todos los periodos del usuario
    const periods = await TradingPeriod.findAll({
      where: { user_id: userId },
      include: [{
        model: DailySession,
        as: 'sessions',
        where: {
          status: {
            [Op.in]: ['target_hit', 'stopped_loss', 'closed']
          }
        },
        required: false,
        include: [{
          model: Trade,
          as: 'trades',
          order: [['trade_number', 'ASC']]
        }],
        order: [['date', 'DESC']]
      }],
      order: [['start_date', 'DESC']]
    });

    // Calcular estadísticas agregadas
    let totalSessions = 0;
    let totalTrades = 0;
    let totalPnL = 0;
    let sessionsWithTarget = 0;
    let sessionsWithStop = 0;

    periods.forEach(period => {
      period.sessions.forEach(session => {
        totalSessions++;
        totalTrades += session.num_trades || 0;
        totalPnL += parseFloat(session.daily_pnl || 0);
        if (session.status === 'target_hit') sessionsWithTarget++;
        if (session.status === 'stopped_loss') sessionsWithStop++;
      });
    });

    res.json({
      success: true,
      statistics: {
        totalPeriods: periods.length,
        totalSessions,
        totalTrades,
        totalPnL: totalPnL.toFixed(2),
        sessionsWithTarget,
        sessionsWithStop,
        winRate: totalSessions > 0 ? ((sessionsWithTarget / totalSessions) * 100).toFixed(2) : 0
      },
      periods: periods.map(period => ({
        ...period.toJSON(),
        sessions: period.sessions.map(session => ({
          ...session.toJSON(),
          trades: session.trades || []
        }))
      }))
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
};

/**
 * Genera un PDF de una sesión específica
 */
const generateSessionPDF = async (req, res) => {
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

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar headers de respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sesion-${session.date}-${session.id}.pdf"`);
    
    // Pipe del PDF a la respuesta
    doc.pipe(res);

    const period = session.period;
    const trades = session.trades || [];
    const startingCapital = parseFloat(session.starting_capital);
    const endingCapital = parseFloat(session.ending_capital || (startingCapital + parseFloat(session.daily_pnl)));
    const dailyPnL = parseFloat(session.daily_pnl);
    const dailyTarget = startingCapital * parseFloat(period.daily_target_pct);
    const maxDailyLoss = startingCapital * parseFloat(period.max_daily_loss_pct);

    // Título
    doc.fontSize(20).text('TradeRoom - Reporte de Sesión', { align: 'center' });
    doc.moveDown();

    // Información del periodo
    doc.fontSize(14).text('Información del Periodo', { underline: true });
    doc.fontSize(10);
    doc.text(`Periodo ID: ${period.id}`);
    doc.text(`Rango: ${new Date(period.start_date).toLocaleDateString('es-CO')} - ${new Date(period.end_date).toLocaleDateString('es-CO')}`);
    doc.text(`Capital Inicial del Periodo: $${parseFloat(period.initial_capital).toFixed(2)}`);
    doc.text(`Capital Actual del Periodo: $${parseFloat(period.current_capital).toFixed(2)}`);
    doc.moveDown();

    // Información de la sesión
    doc.fontSize(14).text('Información de la Sesión', { underline: true });
    doc.fontSize(10);
    doc.text(`Fecha: ${new Date(session.date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}`);
    doc.text(`Capital Inicial: $${startingCapital.toFixed(2)}`);
    doc.text(`Capital Final: $${endingCapital.toFixed(2)}`);
    doc.text(`PnL Diario: $${dailyPnL.toFixed(2)}`);
    doc.text(`Meta Diaria: $${dailyTarget.toFixed(2)} (${(parseFloat(period.daily_target_pct) * 100).toFixed(2)}%)`);
    doc.text(`Pérdida Máxima: $${maxDailyLoss.toFixed(2)} (${(parseFloat(period.max_daily_loss_pct) * 100).toFixed(2)}%)`);
    doc.text(`Número de Operaciones: ${session.num_trades || 0}`);
    doc.text(`Estado: ${session.status}`);
    doc.moveDown();

    // Operaciones
    if (trades.length > 0) {
      doc.fontSize(14).text('Operaciones', { underline: true });
      doc.moveDown(0.5);
      
      // Encabezados de tabla
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [40, 80, 70, 60, 70, 60, 70, 50];
      const headers = ['#', 'Hora', 'Par', 'Stake', 'Resultado', 'Payout', 'PnL', 'Mart.'];
      
      doc.fontSize(9).font('Helvetica-Bold');
      let x = tableLeft;
      headers.forEach((header, i) => {
        doc.text(header, x, tableTop, { width: colWidths[i] });
        x += colWidths[i];
      });
      
      // Línea separadora
      doc.moveTo(tableLeft, doc.y + 5)
         .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), doc.y + 5)
         .stroke();
      
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(8);
      
      // Filas de datos
      trades.forEach(trade => {
        const tradeDate = new Date(trade.created_at);
        const timeStr = tradeDate.toLocaleTimeString('es-CO', { 
          timeZone: 'America/Bogota',
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
        const dateStr = tradeDate.toLocaleDateString('es-CO', {
          timeZone: 'America/Bogota',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        const row = [
          trade.trade_number.toString(),
          `${dateStr} ${timeStr}`,
          trade.currency_pair || 'N/A',
          `$${parseFloat(trade.stake).toFixed(2)}`,
          trade.result,
          `${(parseFloat(trade.payout_real || 0) * 100).toFixed(2)}%`,
          `$${parseFloat(trade.pnl).toFixed(2)}`,
          trade.martingale_step.toString()
        ];
        
        x = tableLeft;
        row.forEach((cell, i) => {
          doc.text(cell, x, doc.y, { width: colWidths[i] });
          x += colWidths[i];
        });
        doc.moveDown(0.3);
      });
    } else {
      doc.text('No hay operaciones registradas en esta sesión.');
    }

    doc.moveDown();
    doc.fontSize(8).text(`Generado el ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`, { align: 'center' });

    // Finalizar PDF
    doc.end();
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar PDF'
    });
  }
};

/**
 * Obtiene estadísticas de todos los usuarios (solo admin)
 */
const getAdminStatistics = async (req, res) => {
  try {
    // Obtener todos los usuarios traders
    const traders = await User.findAll({
      where: { role: 'trader' },
      include: [{
        model: TradingPeriod,
        as: 'periods',
        include: [{
          model: DailySession,
          as: 'sessions',
          include: [{
            model: Trade,
            as: 'trades'
          }]
        }]
      }]
    });

    // Calcular estadísticas por usuario
    const userStatistics = traders.map(user => {
      let totalPeriods = 0;
      let totalSessions = 0;
      let totalTrades = 0;
      let totalPnL = 0;
      let sessionsWithTarget = 0;
      let sessionsWithStop = 0;

      user.periods.forEach(period => {
        totalPeriods++;
        period.sessions.forEach(session => {
          totalSessions++;
          totalTrades += session.trades ? session.trades.length : 0;
          totalPnL += parseFloat(session.daily_pnl || 0);
          if (session.status === 'target_hit') sessionsWithTarget++;
          if (session.status === 'stopped_loss') sessionsWithStop++;
        });
      });

      return {
        userId: user.id,
        username: user.username,
        isActive: user.is_active,
        totalPeriods,
        totalSessions,
        totalTrades,
        totalPnL: totalPnL.toFixed(2),
        sessionsWithTarget,
        sessionsWithStop,
        winRate: totalSessions > 0 ? ((sessionsWithTarget / totalSessions) * 100).toFixed(2) : 0,
        createdAt: user.created_at
      };
    });

    // Estadísticas globales
    const globalStats = {
      totalTraders: traders.length,
      activeTraders: traders.filter(u => u.is_active).length,
      totalPeriods: userStatistics.reduce((sum, u) => sum + u.totalPeriods, 0),
      totalSessions: userStatistics.reduce((sum, u) => sum + u.totalSessions, 0),
      totalTrades: userStatistics.reduce((sum, u) => sum + u.totalTrades, 0),
      totalPnL: userStatistics.reduce((sum, u) => sum + parseFloat(u.totalPnL), 0).toFixed(2)
    };

    res.json({
      success: true,
      globalStats,
      userStatistics
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
};

/**
 * Obtiene detalles de un usuario específico (solo admin)
 */
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      include: [{
        model: TradingPeriod,
        as: 'periods',
        include: [{
          model: DailySession,
          as: 'sessions',
          include: [{
            model: Trade,
            as: 'trades',
            order: [['trade_number', 'ASC']]
          }],
          order: [['date', 'DESC']]
        }],
        order: [['start_date', 'DESC']]
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        periods: user.periods
      }
    });
  } catch (error) {
    console.error('Error al obtener detalles de usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener detalles de usuario'
    });
  }
};

module.exports = {
  getTraderStatistics,
  generateSessionPDF,
  getAdminStatistics,
  getUserDetails
};

