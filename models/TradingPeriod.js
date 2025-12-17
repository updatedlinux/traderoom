const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TradingPeriod = sequelize.define('TradingPeriod', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  initial_capital: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  current_capital: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  daily_target_pct: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    defaultValue: 0.15,
    comment: 'Porcentaje de ganancia diaria objetivo (ej: 0.15 = 15%)'
  },
  profit_pct: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    defaultValue: 0.80,
    comment: 'Porcentaje de payout (ej: 0.80 = 80%)'
  },
  risk_per_trade_pct: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    defaultValue: 0.05,
    comment: 'Porcentaje de riesgo por operación (ej: 0.05 = 5%)'
  },
  martingale_steps: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    comment: 'Número máximo de pasos de martingala'
  },
  max_daily_loss_pct: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    defaultValue: 0.06,
    comment: 'Porcentaje máximo de pérdida diaria (ej: 0.06 = 6%)'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'paused'),
    allowNull: false,
    defaultValue: 'active'
  },
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Sobrenombre o apodo para identificar el periodo fácilmente (ej: IQOption, Quotex, Cuenta Demo)'
  }
}, {
  tableName: 'trading_periods',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = TradingPeriod;

