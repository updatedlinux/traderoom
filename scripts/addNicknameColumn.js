const sequelize = require('../config/database');
require('../models'); // Cargar todos los modelos para que Sequelize los conozca
require('dotenv').config();

async function addNicknameColumn() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión establecida.');

    console.log('Verificando si la columna nickname existe en la tabla trading_periods...');
    
    // Verificar si la columna ya existe
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'trading_periods'
      AND COLUMN_NAME = 'nickname';
    `);

    if (results.length > 0) {
      console.log('✓ La columna nickname ya existe en la tabla trading_periods.');
      console.log('  Detalles:', results[0]);
      await sequelize.close();
      process.exit(0);
    }

    console.log('La columna nickname no existe. Agregándola...');
    
    // Agregar la columna
    await sequelize.query(`
      ALTER TABLE trading_periods
      ADD COLUMN nickname VARCHAR(100) NULL COMMENT 'Sobrenombre o apodo para identificar el periodo fácilmente (ej: IQOption, Quotex, Cuenta Demo)';
    `);
    
    console.log('✓ Columna nickname agregada exitosamente a la tabla trading_periods.');
    console.log('La base de datos está actualizada con todos los campos necesarios.');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la sincronización:', error.message);
    if (error.original) {
      console.error('Detalle:', error.original.message);
      console.error('Código:', error.original.code);
    }
    await sequelize.close();
    process.exit(1);
  }
}

addNicknameColumn();

