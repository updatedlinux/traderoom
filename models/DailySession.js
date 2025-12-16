const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailySession = sequelize.define('DailySession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  period_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'trading_periods',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  starting_capital: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  ending_capital: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  daily_pnl: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  num_trades: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'target_hit', 'stopped_loss', 'closed'),
    allowNull: false,
    defaultValue: 'in_progress'
  }
}, {
  tableName: 'daily_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DailySession;

