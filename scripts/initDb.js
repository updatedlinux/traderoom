const sequelize = require('../config/database');
const { User } = require('../models');
require('dotenv').config();

async function initDatabase() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión establecida.');

    console.log('Sincronizando modelos...');
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados.');

    // Verificar si existe un usuario admin
    const adminUser = await User.findOne({ where: { role: 'admin' } });

    if (!adminUser) {
      const adminUsername = process.env.ADMIN_USER;
      const adminPassword = process.env.ADMIN_PASS;

      if (!adminUsername || !adminPassword) {
        console.error('ERROR: ADMIN_USER y ADMIN_PASS deben estar definidos en .env');
        process.exit(1);
      }

      console.log(`Creando usuario administrador: ${adminUsername}`);
      const newAdmin = await User.create({
        username: adminUsername,
        password_hash: adminPassword, // El hook del modelo lo hasheará
        role: 'admin',
        is_active: true
      });

      console.log('Usuario administrador creado exitosamente.');
      console.log(`ID: ${newAdmin.id}, Username: ${newAdmin.username}, Role: ${newAdmin.role}`);
    } else {
      console.log('Ya existe un usuario administrador en la base de datos.');
      console.log(`Username: ${adminUser.username}`);
    }

    console.log('Inicialización completada.');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la inicialización:', error);
    process.exit(1);
  }
}

initDatabase();

