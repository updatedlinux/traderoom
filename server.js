const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const traderRoutes = require('./routes/trader');

const app = express();

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'traderoom-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde assets
app.use(express.static(path.join(__dirname, 'assets')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', traderRoutes);

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

