const sequelize = require('../config/database');
require('dotenv').config();

async function addPayoutRealColumn() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión establecida.');

    // Verificar si la columna ya existe
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'trades' 
      AND COLUMN_NAME = 'payout_real'
    `);

    if (results.length > 0) {
      console.log('La columna payout_real ya existe en la tabla trades.');
    } else {
      console.log('Agregando columna payout_real a la tabla trades...');
      await sequelize.query(`
        ALTER TABLE trades 
        ADD COLUMN payout_real DECIMAL(5,4) NULL 
        COMMENT 'Payout real de la operación (ej: 0.85 = 85%, 0.99 = 99%)'
      `);
      console.log('Columna payout_real agregada exitosamente.');
    }

    console.log('\n✅ Sincronización completada exitosamente.\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la sincronización:', error.message);
    if (error.original) {
      console.error('Detalle:', error.original.message);
    }
    console.error('\nStack completo:', error.stack);
    process.exit(1);
  }
}

addPayoutRealColumn();

