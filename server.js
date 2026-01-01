const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Configurar timezone a GMT-5 (Bogotá)
process.env.TZ = 'America/Bogota';

const sequelize = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const traderRoutes = require('./routes/trader');
const statisticsRoutes = require('./routes/statistics');
const telegramRoutes = require('./routes/telegram.routes');

const app = express();

// Trust proxy - Necesario cuando hay SSL offloading (Nginx Proxy Manager)
app.set('trust proxy', 1);

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'traderoom-secret-key-change-in-production',
  resave: false, // Solo guardar si la sesión fue modificada
  saveUninitialized: false,
  name: 'traderoom.sid', // Nombre de la cookie
  cookie: {
    secure: true, // Siempre true porque estamos detrás de proxy HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: 'none', // Necesario para cross-site (subdominios diferentes)
    domain: '.soyjonnymelendez.net' // Compartir cookie entre subdominios
  },
  proxy: true // Confiar en el proxy
}));


// Middlewares - CORS completamente abierto
app.use(cors({
  origin: true, // Permitir todos los orígenes
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde assets
app.use(express.static(path.join(__dirname, 'assets')));

// Rutas API - IMPORTANTE: Orden específico primero, luego general
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/statistics', require('./routes/statistics')); // Debe ir ANTES de /api para evitar conflicto
app.use('/api', telegramRoutes); // Rutas de Telegram (debe ir antes de traderRoutes)
app.use('/api', traderRoutes); // Esta es más general, debe ir al final

// Ruta raíz - servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'assets', 'index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

// Inicializar servidor
const PORT_BACKEND = process.env.PORT_BACKEND || 3000;
const PORT_FRONTEND = process.env.PORT_FRONTEND || 80;

// Crear servidor HTTP para Socket.io
const server = http.createServer(app);

// Configurar Socket.io
const io = socketIo(server, {
  cors: {
    origin: true, // Permitir todos los orígenes
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Hacer io disponible en la app
app.set('io', io);

// Probar conexión a la base de datos
sequelize.authenticate()
  .then(() => {
    console.log('Conexión a MariaDB establecida correctamente.');
    
    // Configurar cron job para crear sesiones diarias automáticamente a las 00:00 GMT-5
    try {
      const cron = require('node-cron');
      const { createDailySessionsForActivePeriods } = require('./services/dailySessionScheduler');
      
      // Cron job que se ejecuta todos los días a las 00:00 en GMT-5 (Bogotá)
      // Nota: node-cron usa la zona horaria del servidor, pero como configuramos TZ='America/Bogota',
      // el cron se ejecutará a las 00:00 hora de Bogotá
      // Formato: segundo minuto hora día mes día-semana
      // '0 0 0 * * *' = todos los días a las 00:00:00
      cron.schedule('0 0 0 * * *', async () => {
        console.log('[CRON] Ejecutando tarea programada: Creación automática de sesiones diarias');
        await createDailySessionsForActivePeriods();
      }, {
        timezone: 'America/Bogota' // Asegurar que se ejecute en zona horaria de Bogotá
      });
      
      console.log('[CRON] Tarea programada configurada: Creación automática de sesiones diarias a las 00:00 GMT-5 (Bogotá)');
    } catch (error) {
      console.warn('[CRON] No se pudo configurar el cron job. Asegúrate de que node-cron esté instalado:', error.message);
      console.warn('[CRON] Ejecuta: npm install node-cron');
    }
    
    // Inicializar Telegram Signal Listener
    try {
      const TelegramSignalListener = require('./services/telegram-listener');
      const telegramListener = new TelegramSignalListener(io);
      app.set('telegramListener', telegramListener);
      
      // Iniciar listener de Telegram (no bloquea si no está configurado)
      telegramListener.start().catch((error) => {
        console.warn('⚠️  No se pudo iniciar el listener de Telegram:', error.message);
      });
    } catch (error) {
      console.warn('⚠️  Error al inicializar Telegram listener:', error.message);
      console.warn('   Asegúrate de que las dependencias estén instaladas: npm install telegram input');
    }
    
    // Iniciar servidor HTTP (con Socket.io) en puerto backend
    server.listen(PORT_BACKEND, () => {
      console.log(`🚀 Servidor backend escuchando en puerto ${PORT_BACKEND}`);
    });

    // Si PORT_FRONTEND es diferente, iniciar otro servidor (opcional)
    // Por simplicidad, servimos el frontend desde el mismo servidor Express
    // En producción, Nginx Proxy Manager manejará el enrutamiento
    if (PORT_FRONTEND !== PORT_BACKEND && PORT_FRONTEND !== 80) {
      const frontendApp = express();
      frontendApp.use(express.static(path.join(__dirname, 'assets')));
      frontendApp.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'assets', 'index.html'));
      });
      frontendApp.listen(PORT_FRONTEND, () => {
        console.log(`Servidor frontend escuchando en puerto ${PORT_FRONTEND}`);
      });
    }
  })
  .catch(err => {
    console.error('Error al conectar con MariaDB:', err);
    process.exit(1);
  });

// Manejo de cierre limpio
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  const telegramListener = app.get('telegramListener');
  if (telegramListener) {
    await telegramListener.stop();
  }
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor...');
  const telegramListener = app.get('telegramListener');
  if (telegramListener) {
    await telegramListener.stop();
  }
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = app;

