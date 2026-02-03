const { TradingSignal, Sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getSignals = async (req, res) => {
    try {
        const { startDate, endDate, pair, strategy } = req.query;

        const where = {};

        // Filter by date range
        if (startDate && endDate) {
            where.date = {
                [Op.between]: [
                    new Date(startDate + 'T00:00:00'),
                    new Date(endDate + 'T23:59:59')
                ]
            };
        } else if (startDate) {
            where.date = {
                [Op.gte]: new Date(startDate + 'T00:00:00')
            };
        }

        // Filter by pair
        if (pair) {
            where.pair = { [Op.like]: `%${pair}%` };
        }

        // Filter by strategy
        if (strategy) {
            where.strategy = strategy;
        }

        const signals = await TradingSignal.findAll({
            where,
            order: [['date', 'DESC']],
            limit: 100 // Limit results for performance
        });

        res.json({
            success: true,
            count: signals.length,
            signals: signals
        });

    } catch (error) {
        console.error('Error fetching signals:', error);
        res.status(500).json({ success: false, error: 'Error al obtener señales' });
    }
};


exports.exportSignals = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const ExcelJS = require('exceljs');

        const where = {};
        if (startDate) {
            const start = new Date(startDate + 'T00:00:00');
            const end = endDate ? new Date(endDate + 'T23:59:59') : new Date(startDate + 'T23:59:59');
            where.date = { [Op.between]: [start, end] };
        }

        const signals = await TradingSignal.findAll({
            where,
            order: [['date', 'DESC']]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Señales');

        // Column Config
        worksheet.columns = [
            { header: 'Fecha y Hora', key: 'date', width: 20 },
            { header: 'Par', key: 'pair', width: 15 },
            { header: 'Dirección', key: 'direction', width: 12 },
            { header: 'Estrategia', key: 'strategy', width: 25 },
            { header: 'Condiciones', key: 'conditions', width: 40 }
        ];

        // Header Style
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF010332' } // TradeRoom Blue
        };

        // Add Data
        signals.forEach(signal => {
            // Format date to Bogotá time
            const dateObj = new Date(signal.date);
            const formattedDate = dateObj.toLocaleString('es-CO', {
                timeZone: 'America/Bogota',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });

            const row = worksheet.addRow({
                date: formattedDate,
                pair: signal.pair,
                direction: signal.direction,
                strategy: signal.strategy,
                conditions: signal.conditions
            });

            // Conditional Formatting
            const dirCell = row.getCell('direction');
            if (signal.direction === 'CALL') {
                dirCell.font = { color: { argb: 'FF28A745' }, bold: true }; // Green
            } else if (signal.direction === 'PUT') {
                dirCell.font = { color: { argb: 'FFDC3545' }, bold: true }; // Red
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Senales_${startDate}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting signals:', error);
        res.status(500).send('Error generando el reporte');
    }
};
