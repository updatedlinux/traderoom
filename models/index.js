const User = require('./User');
const TradingPeriod = require('./TradingPeriod');
const DailySession = require('./DailySession');
const Trade = require('./Trade');

// Definir relaciones
TradingPeriod.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(TradingPeriod, { foreignKey: 'user_id', as: 'periods' });

DailySession.belongsTo(TradingPeriod, { foreignKey: 'period_id', as: 'period' });
TradingPeriod.hasMany(DailySession, { foreignKey: 'period_id', as: 'sessions' });

Trade.belongsTo(DailySession, { foreignKey: 'session_id', as: 'session' });
DailySession.hasMany(Trade, { foreignKey: 'session_id', as: 'trades' });

module.exports = {
  User,
  TradingPeriod,
  DailySession,
  Trade
};

