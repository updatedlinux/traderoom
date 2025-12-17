const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Trade = sequelize.define('Trade', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  session_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'daily_sessions',
      key: 'id'
    }
  },
  trade_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stake: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  result: {
    type: DataTypes.ENUM('ITM', 'OTM'),
    allowNull: false
  },
  pnl: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  capital_after: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  martingale_step: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Paso de martingala actual (0..martingale_steps)'
  },
  currency_pair: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Par de divisas (ej: EUR/USD, GBP/USD, etc.)'
  },
  payout_real: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    comment: 'Payout real de la operación (ej: 0.85 = 85%, 0.99 = 99%)'
  }
}, {
  tableName: 'trades',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Trade;

