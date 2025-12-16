const { Sequelize } = require('sequelize');
const { User } = require('../models');
require('dotenv').config();

async function initDatabase() {
  let tempSequelize = null;
  let sequelize = null;

  try {
    const dbName = process.env.DB_NAME;
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASS;
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT || 3306;

    if (!dbName || !dbUser || !dbPass || !dbHost) {
      console.error('ERROR: DB_NAME, DB_USER, DB_PASS y DB_HOST deben estar definidos en .env');
      process.exit(1);
    }

    // Paso 1: Conectar sin especificar la base de datos para crear la BD si no existe
    console.log('Conectando al servidor MariaDB...');
    tempSequelize = new Sequelize('', dbUser, dbPass, {
      host: dbHost,
      port: dbPort,
      dialect: 'mariadb',
      logging: false
    });

    await tempSequelize.authenticate();
    console.log('Conexión al servidor establecida.');

    // Paso 2: Crear la base de datos si no existe
    console.log(`Verificando/Creando base de datos '${dbName}'...`);
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Base de datos '${dbName}' lista.`);

    // Cerrar conexión temporal
    await tempSequelize.close();

    // Paso 3: Conectar a la base de datos específica
    console.log('Conectando a la base de datos...');
    sequelize = new Sequelize(dbName, dbUser, dbPass, {
      host: dbHost,
      port: dbPort,
      dialect: 'mariadb',
      logging: false,
      timezone: '-05:00', // GMT-5 (Bogotá)
      dialectOptions: {
        timezone: 'local'
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    // Paso 4: Sincronizar modelos (crear tablas)
    console.log('Sincronizando modelos (creando tablas)...');
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados (tablas creadas/actualizadas).');

    // Paso 5: Verificar si existe un usuario admin
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

    console.log('\n✅ Inicialización completada exitosamente.');
    console.log('La base de datos y las tablas están listas para usar.\n');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la inicialización:', error.message);
    if (error.original) {
      console.error('Detalle:', error.original.message);
    }
    
    // Cerrar conexiones si están abiertas
    if (tempSequelize) {
      try {
        await tempSequelize.close();
      } catch (e) {}
    }
    if (sequelize) {
      try {
        await sequelize.close();
      } catch (e) {}
    }
    
    process.exit(1);
  }
}

initDatabase();

