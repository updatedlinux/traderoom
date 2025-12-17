const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Configurar timezone a GMT-5 (Bogotá)
process.env.TZ = 'America/Bogota';

const sequelize = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const traderRoutes = require('./routes/trader');
const statisticsRoutes = require('./routes/statistics');

const app = express();

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'traderoom-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'traderoom.sid', // Nombre de la cookie
  cookie: {
    secure: false, // Permitir cookies en HTTP y HTTPS (ajustar según necesidad)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: 'lax' // Permitir cookies en requests cross-origin
  }
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

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', traderRoutes);
app.use('/api/statistics', require('./routes/statistics'));

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

// Probar conexión a la base de datos
sequelize.authenticate()
  .then(() => {
    console.log('Conexión a MariaDB establecida correctamente.');
    
    // Iniciar servidor en puerto backend
    app.listen(PORT_BACKEND, () => {
      console.log(`Servidor backend escuchando en puerto ${PORT_BACKEND}`);
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

module.exports = app;

