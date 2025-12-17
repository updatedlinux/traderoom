const { TradingPeriod, DailySession, Trade, User } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

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
 * Genera un archivo Excel de una sesión específica con gráficas
 */
const generateSessionExcel = async (req, res) => {
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

    // Crear workbook de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TradeRoom';
    workbook.created = new Date();
    workbook.modified = new Date();

    const period = session.period;
    const trades = session.trades || [];
    const startingCapital = parseFloat(session.starting_capital);
    const endingCapital = parseFloat(session.ending_capital || (startingCapital + parseFloat(session.daily_pnl)));
    const dailyPnL = parseFloat(session.daily_pnl);
    const dailyTarget = startingCapital * parseFloat(period.daily_target_pct);
    const maxDailyLoss = startingCapital * parseFloat(period.max_daily_loss_pct);

    // Hoja 1: Información General
    const infoSheet = workbook.addWorksheet('Información');
    
    // Estilos
    const headerStyle = {
      font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00568E' }
      },
      alignment: { vertical: 'middle', horizontal: 'center' }
    };

    const titleStyle = {
      font: { bold: true, size: 16, color: { argb: 'FF00568E' } },
      alignment: { vertical: 'middle', horizontal: 'center' }
    };

    const labelStyle = {
      font: { bold: true, size: 11 },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' }
      }
    };

    // Título
    infoSheet.mergeCells('A1:D1');
    infoSheet.getCell('A1').value = 'TradeRoom - Reporte de Sesión';
    infoSheet.getCell('A1').style = titleStyle;
    infoSheet.getRow(1).height = 25;

    let currentRow = 3;

    // Información del Periodo
    infoSheet.getCell(`A${currentRow}`).value = 'INFORMACIÓN DEL PERIODO';
    infoSheet.getCell(`A${currentRow}`).style = headerStyle;
    infoSheet.mergeCells(`A${currentRow}:D${currentRow}`);
    infoSheet.getRow(currentRow).height = 20;
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'Periodo ID:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = period.id;
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'Rango de Fechas:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = `${new Date(period.start_date).toLocaleDateString('es-CO')} - ${new Date(period.end_date).toLocaleDateString('es-CO')}`;
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'Capital Inicial del Periodo:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = parseFloat(period.initial_capital).toFixed(2);
    infoSheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'Capital Actual del Periodo:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = parseFloat(period.current_capital).toFixed(2);
    infoSheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    currentRow += 2;

    // Información de la Sesión
    infoSheet.getCell(`A${currentRow}`).value = 'INFORMACIÓN DE LA SESIÓN';
    infoSheet.getCell(`A${currentRow}`).style = headerStyle;
    infoSheet.mergeCells(`A${currentRow}:D${currentRow}`);
    infoSheet.getRow(currentRow).height = 20;
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'Fecha:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = new Date(session.date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'Capital Inicial:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = startingCapital.toFixed(2);
    infoSheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'Capital Final:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = endingCapital.toFixed(2);
    infoSheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'PnL Diario:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = dailyPnL.toFixed(2);
    infoSheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    infoSheet.getCell(`B${currentRow}`).font = { color: { argb: dailyPnL >= 0 ? 'FF00AA00' : 'FFFF0000' }, bold: true };
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'Meta Diaria:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = dailyTarget.toFixed(2);
    infoSheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    infoSheet.getCell(`C${currentRow}`).value = `(${(parseFloat(period.daily_target_pct) * 100).toFixed(2)}%)`;
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'Pérdida Máxima:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = maxDailyLoss.toFixed(2);
    infoSheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
    infoSheet.getCell(`C${currentRow}`).value = `(${(parseFloat(period.max_daily_loss_pct) * 100).toFixed(2)}%)`;
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'Número de Operaciones:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = session.num_trades || 0;
    currentRow++;

    infoSheet.getCell(`A${currentRow}`).value = 'Estado:';
    infoSheet.getCell(`A${currentRow}`).style = labelStyle;
    infoSheet.getCell(`B${currentRow}`).value = session.status;
    currentRow += 2;

    infoSheet.getCell(`A${currentRow}`).value = `Generado el ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`;
    infoSheet.getCell(`A${currentRow}`).font = { italic: true, size: 9 };
    infoSheet.mergeCells(`A${currentRow}:D${currentRow}`);

    // Ajustar ancho de columnas
    infoSheet.getColumn('A').width = 30;
    infoSheet.getColumn('B').width = 20;
    infoSheet.getColumn('C').width = 15;
    infoSheet.getColumn('D').width = 15;

    // Hoja 2: Operaciones
    const tradesSheet = workbook.addWorksheet('Operaciones');
    
    // Encabezados
    tradesSheet.getRow(1).values = ['#', 'Fecha y Hora', 'Par de Divisas', 'Stake', 'Resultado', 'Payout (%)', 'PnL', 'Capital Después', 'Martingala'];
    tradesSheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    tradesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00568E' }
    };
    tradesSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    tradesSheet.getRow(1).height = 20;

    // Datos de operaciones
    if (trades.length > 0) {
      trades.forEach((trade, index) => {
        const row = tradesSheet.getRow(index + 2);
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

        row.values = [
          trade.trade_number,
          `${dateStr} ${timeStr}`,
          trade.currency_pair || 'N/A',
          parseFloat(trade.stake),
          trade.result,
          parseFloat(trade.payout_real || 0) * 100,
          parseFloat(trade.pnl),
          parseFloat(trade.capital_after),
          trade.martingale_step
        ];

        // Formato de números
        row.getCell(4).numFmt = '$#,##0.00'; // Stake
        row.getCell(6).numFmt = '0.00%'; // Payout
        row.getCell(7).numFmt = '$#,##0.00'; // PnL
        row.getCell(8).numFmt = '$#,##0.00'; // Capital Después

        // Color según resultado
        if (trade.result === 'ITM') {
          row.getCell(5).font = { color: { argb: 'FF00AA00' }, bold: true };
          row.getCell(7).font = { color: { argb: 'FF00AA00' } };
        } else {
          row.getCell(5).font = { color: { argb: 'FFFF0000' }, bold: true };
          row.getCell(7).font = { color: { argb: 'FFFF0000' } };
        }

        // Alineación
        row.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Ajustar ancho de columnas
      tradesSheet.getColumn(1).width = 8;  // #
      tradesSheet.getColumn(2).width = 20; // Fecha y Hora
      tradesSheet.getColumn(3).width = 15; // Par
      tradesSheet.getColumn(4).width = 12; // Stake
      tradesSheet.getColumn(5).width = 12; // Resultado
      tradesSheet.getColumn(6).width = 12; // Payout
      tradesSheet.getColumn(7).width = 12; // PnL
      tradesSheet.getColumn(8).width = 15; // Capital Después
      tradesSheet.getColumn(9).width = 12; // Martingala

      // Congelar primera fila
      tradesSheet.views = [{
        state: 'frozen',
        ySplit: 1
      }];
    } else {
      tradesSheet.getCell('A2').value = 'No hay operaciones registradas en esta sesión.';
    }

    // Hoja 3: Datos para Gráficas
    // Nota: ExcelJS no soporta crear gráficas programáticamente
    // Los datos están organizados para que el usuario pueda crear gráficas fácilmente en Excel
    const chartsSheet = workbook.addWorksheet('Datos para Gráficas');

    // Datos para gráficas
    if (trades.length > 0) {
      // Preparar datos para gráfica de evolución de capital
      chartsSheet.getCell('A1').value = 'Operación';
      chartsSheet.getCell('B1').value = 'Capital Después';
      chartsSheet.getCell('C1').value = 'PnL Acumulado';
      chartsSheet.getRow(1).font = { bold: true };
      chartsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00568E' }
      };
      chartsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      let cumulativePnL = 0;
      trades.forEach((trade, index) => {
        cumulativePnL += parseFloat(trade.pnl);
        chartsSheet.getCell(`A${index + 2}`).value = trade.trade_number;
        chartsSheet.getCell(`B${index + 2}`).value = parseFloat(trade.capital_after);
        chartsSheet.getCell(`C${index + 2}`).value = cumulativePnL;
        chartsSheet.getCell(`B${index + 2}`).numFmt = '$#,##0.00';
        chartsSheet.getCell(`C${index + 2}`).numFmt = '$#,##0.00';
      });

      // Nota: ExcelJS no soporta gráficas de forma nativa
      // Los datos están preparados para que el usuario pueda crear gráficas manualmente en Excel
      // o usar Excel para generar gráficas automáticamente desde los datos
      
      // Agregar título para la sección de gráficas
      chartsSheet.getCell('A' + (trades.length + 3)).value = 'NOTA:';
      chartsSheet.getCell('A' + (trades.length + 3)).font = { bold: true, size: 12, color: { argb: 'FF00568E' } };
      chartsSheet.getCell('A' + (trades.length + 4)).value = 'Los datos están listos para crear gráficas en Excel.';
      chartsSheet.getCell('A' + (trades.length + 4)).font = { size: 10 };
      chartsSheet.getCell('A' + (trades.length + 5)).value = 'Selecciona los datos y usa Insertar > Gráfica en Excel.';
      chartsSheet.getCell('A' + (trades.length + 5)).font = { size: 10 };
      
      // Preparar datos para gráfica de distribución ITM vs OTM
      const itmCount = trades.filter(t => t.result === 'ITM').length;
      const otmCount = trades.filter(t => t.result === 'OTM').length;

      chartsSheet.getCell('E1').value = 'Resultado';
      chartsSheet.getCell('F1').value = 'Cantidad';
      chartsSheet.getRow(1).getCell(5).font = { bold: true };
      chartsSheet.getRow(1).getCell(6).font = { bold: true };
      chartsSheet.getRow(1).getCell(5).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00568E' }
      };
      chartsSheet.getRow(1).getCell(6).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00568E' }
      };
      chartsSheet.getRow(1).getCell(5).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      chartsSheet.getRow(1).getCell(6).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      chartsSheet.getCell('E2').value = 'ITM';
      chartsSheet.getCell('F2').value = itmCount;
      chartsSheet.getCell('E3').value = 'OTM';
      chartsSheet.getCell('F3').value = otmCount;
      
      // Agregar instrucciones para crear gráficas
      chartsSheet.getCell('E' + (trades.length + 3)).value = 'Para crear gráfica de pastel:';
      chartsSheet.getCell('E' + (trades.length + 3)).font = { bold: true, size: 10 };
      chartsSheet.getCell('E' + (trades.length + 4)).value = '1. Selecciona E1:F3';
      chartsSheet.getCell('E' + (trades.length + 4)).font = { size: 9 };
      chartsSheet.getCell('E' + (trades.length + 5)).value = '2. Insertar > Gráfica de Pastel';
      chartsSheet.getCell('E' + (trades.length + 5)).font = { size: 9 };
      
      chartsSheet.getCell('A' + (trades.length + 7)).value = 'Para crear gráfica de línea (Capital):';
      chartsSheet.getCell('A' + (trades.length + 7)).font = { bold: true, size: 10 };
      chartsSheet.getCell('A' + (trades.length + 8)).value = '1. Selecciona A1:B' + (trades.length + 1);
      chartsSheet.getCell('A' + (trades.length + 8)).font = { size: 9 };
      chartsSheet.getCell('A' + (trades.length + 9)).value = '2. Insertar > Gráfica de Línea';
      chartsSheet.getCell('A' + (trades.length + 9)).font = { size: 9 };
      
      chartsSheet.getCell('A' + (trades.length + 11)).value = 'Para crear gráfica de línea (PnL Acumulado):';
      chartsSheet.getCell('A' + (trades.length + 11)).font = { bold: true, size: 10 };
      chartsSheet.getCell('A' + (trades.length + 12)).value = '1. Selecciona A1:C' + (trades.length + 1);
      chartsSheet.getCell('A' + (trades.length + 12)).font = { size: 9 };
      chartsSheet.getCell('A' + (trades.length + 13)).value = '2. Insertar > Gráfica de Línea';
      chartsSheet.getCell('A' + (trades.length + 13)).font = { size: 9 };

      // Ajustar ancho de columnas
      chartsSheet.getColumn('A').width = 12;
      chartsSheet.getColumn('B').width = 18;
      chartsSheet.getColumn('C').width = 18;
      chartsSheet.getColumn('E').width = 12;
      chartsSheet.getColumn('F').width = 12;
    } else {
      chartsSheet.getCell('A1').value = 'No hay datos suficientes para generar gráficas.';
    }

    // Configurar headers de respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="sesion-${session.date}-${session.id}.xlsx"`);

    // Escribir el workbook a la respuesta
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al generar Excel:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar Excel'
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
  generateSessionExcel,
  getAdminStatistics,
  getUserDetails
};

