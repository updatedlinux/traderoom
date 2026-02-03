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
