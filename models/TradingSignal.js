const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TradingSignal = sequelize.define('TradingSignal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    message_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    raw_message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    pair: {
        type: DataTypes.STRING,
        allowNull: true
    },
    direction: {
        type: DataTypes.STRING, // 'CALL', 'PUT'
        allowNull: true
    },
    strategy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    conditions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    expiration: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'trading_signals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = TradingSignal;
