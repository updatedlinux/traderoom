const sequelize = require('../config/database');
require('dotenv').config();

async function syncDatabase() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión establecida.');

    console.log('Sincronizando modelos (agregando columnas faltantes)...');
    // Usar alter: true para agregar columnas nuevas sin perder datos
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados exitosamente.');
    console.log('La base de datos está actualizada con todos los campos necesarios.');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la sincronización:', error.message);
    if (error.original) {
      console.error('Detalle:', error.original.message);
    }
    process.exit(1);
  }
}

syncDatabase();

