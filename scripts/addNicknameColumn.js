const sequelize = require('../config/database');
require('../models'); // Cargar todos los modelos para que Sequelize los conozca
require('dotenv').config();

async function addNicknameColumn() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión establecida.');

    console.log('Verificando y agregando columna nickname a la tabla trading_periods...');
    
    // Intentar agregar la columna. Si ya existe, MariaDB lanzará un error que podemos capturar.
    await sequelize.query(`
      ALTER TABLE trading_periods
      ADD COLUMN nickname VARCHAR(100) NULL COMMENT 'Sobrenombre o apodo para identificar el periodo fácilmente (ej: IQOption, Quotex, Cuenta Demo)';
    `);
    console.log('Columna nickname agregada exitosamente a la tabla trading_periods.');
    console.log('La base de datos está actualizada con todos los campos necesarios.');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.warn('La columna nickname ya existe en la tabla trading_periods. No se realizó ningún cambio.');
      await sequelize.close();
      process.exit(0);
    }
    console.error('\n❌ Error durante la sincronización:', error.message);
    if (error.original) {
      console.error('Detalle:', error.original.message);
    }
    await sequelize.close();
    process.exit(1);
  }
}

addNicknameColumn();

