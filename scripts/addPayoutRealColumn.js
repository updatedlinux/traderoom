const sequelize = require('../config/database');
require('dotenv').config();

async function addPayoutRealColumn() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión establecida.');

    console.log('Agregando columna payout_real a la tabla trades...');
    
    // Intentar agregar la columna directamente
    // Si ya existe, MariaDB lanzará un error que capturaremos
    try {
      await sequelize.query(`
        ALTER TABLE trades 
        ADD COLUMN payout_real DECIMAL(5,4) NULL 
        COMMENT 'Payout real de la operación (ej: 0.85 = 85%, 0.99 = 99%)'
      `, { raw: true });
      console.log('✅ Columna payout_real agregada exitosamente.');
    } catch (addError) {
      // Si el error es que la columna ya existe, está bien
      if (addError.original && addError.original.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  La columna payout_real ya existe en la tabla trades.');
      } else {
        // Si es otro error, lo relanzamos
        throw addError;
      }
    }

    console.log('\n✅ Proceso completado exitosamente.\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la operación:', error.message);
    if (error.original) {
      console.error('Detalle SQL:', error.original.message);
      console.error('Código SQL:', error.original.code);
    }
    process.exit(1);
  }
}

addPayoutRealColumn();

