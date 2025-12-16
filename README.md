# TradeRoom

Sistema de gestión de riesgo para trading de opciones binarias y scalping. TradeRoom permite gestionar periodos de trading, sesiones diarias y operaciones con control de riesgo mediante martingala limitada y stops automáticos.

## Descripción

TradeRoom es una aplicación web que facilita la gestión de riesgo en operaciones de trading, inspirada en un sistema de gestión basado en Excel. La aplicación permite:

- **Gestión de usuarios**: Administradores pueden crear y gestionar usuarios traders
- **Periodos de trading**: Configuración de periodos con parámetros personalizables
- **Sesiones diarias**: Control de operaciones diarias con stops automáticos
- **Registro de operaciones**: Registro de operaciones ITM/OTM con cálculo automático de stakes y martingala
- **Control de riesgo**: Implementación de martingala limitada y stops de pérdida/ganancia

## Requisitos Previos

- **Node.js**: Versión 14 o superior
- **MariaDB**: Versión 10.3 o superior
- **npm**: Gestor de paquetes de Node.js

## Configuración

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las siguientes variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Base de datos MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASS=tu_contraseña
DB_NAME=traderoom

# Usuario administrador inicial
ADMIN_USER=admin
ADMIN_PASS=tu_contraseña_segura

# Sesión
SESSION_SECRET=tu_secret_key_muy_segura_aqui_cambiar_en_produccion

# Puertos
PORT_BACKEND=3000
PORT_FRONTEND=80
```

### 2. Instalación de Dependencias

```bash
npm install
```

### 3. Inicialización de la Base de Datos

Ejecuta el script de inicialización para crear las tablas y el usuario administrador:

```bash
npm run init:db
```

Este comando:
- Crea todas las tablas necesarias en MariaDB
- Crea el usuario administrador inicial usando las variables `ADMIN_USER` y `ADMIN_PASS` del archivo `.env`

**Importante**: Asegúrate de que las variables `ADMIN_USER` y `ADMIN_PASS` estén configuradas en `.env` antes de ejecutar este comando.

## Ejecución

### Modo Desarrollo

```bash
npm run dev
```

### Modo Producción

```bash
npm start
```

El servidor backend estará disponible en el puerto configurado en `PORT_BACKEND` (por defecto 3000).

El frontend se sirve desde el mismo servidor Express en la ruta raíz (`/`). Los archivos estáticos se encuentran en la carpeta `assets/`.

## Deployment con Nginx Proxy Manager

La aplicación está diseñada para desplegarse detrás de Nginx Proxy Manager con SSL offloading.

### Configuración de Dominios

- **Frontend**: `https://traderoom.soyjonnymelendez.net`
- **Backend API**: `https://backtrade.soyjonnymelendez.net`

### Configuración de Nginx Proxy Manager

1. **Proxy Host para Frontend**:
   - Domain Names: `traderoom.soyjonnymelendez.net`
   - Forward Hostname/IP: IP del servidor
   - Forward Port: `80` (o el puerto donde corre Express)
   - SSL: Habilitar SSL con certificado Let's Encrypt

2. **Proxy Host para Backend**:
   - Domain Names: `backtrade.soyjonnymelendez.net`
   - Forward Hostname/IP: IP del servidor
   - Forward Port: `3000` (puerto del backend)
   - SSL: Habilitar SSL con certificado Let's Encrypt

### Configuración del Frontend

El frontend detecta automáticamente si está siendo servido desde el dominio de producción y ajusta la URL de la API:

- Si el dominio contiene `traderoom.soyjonnymelendez.net`, usa `https://backtrade.soyjonnymelendez.net/api`
- En desarrollo local, usa `/api`

## Estructura del Proyecto

```
traderoom/
├── assets/              # Archivos estáticos (HTML, CSS, JS, imágenes)
│   ├── index.html       # Frontend principal
│   ├── css/            # Hojas de estilo
│   ├── js/             # Scripts del frontend
│   ├── img/            # Imágenes
│   └── favicon/        # Iconos del sitio
├── config/             # Configuración
│   └── database.js     # Configuración de Sequelize
├── controllers/        # Controladores
│   ├── authController.js
│   ├── adminController.js
│   └── traderController.js
├── middlewares/        # Middlewares
│   └── auth.js        # Autenticación y autorización
├── models/            # Modelos de Sequelize
│   ├── User.js
│   ├── TradingPeriod.js
│   ├── DailySession.js
│   ├── Trade.js
│   └── index.js
├── routes/            # Rutas
│   ├── auth.js
│   ├── admin.js
│   └── trader.js
├── scripts/           # Scripts de utilidad
│   └── initDb.js     # Inicialización de base de datos
├── services/         # Servicios de negocio
│   └── tradingService.js  # Lógica de trading
├── server.js         # Servidor principal
├── package.json
├── .env.example
└── README.md
```

## Modelo de Datos

### User
- Usuarios del sistema (admin y trader)
- Autenticación con bcrypt

### TradingPeriod
- Periodos de trading con parámetros configurables
- Capital inicial y actual
- Porcentajes de meta, riesgo, payout, etc.

### DailySession
- Sesiones diarias de trading
- Control de PnL diario y número de operaciones
- Estados: in_progress, target_hit, stopped_loss, closed

### Trade
- Operaciones individuales
- Registro de stake, resultado (ITM/OTM), PnL
- Control de pasos de martingala

## Lógica de Trading

### Cálculo de Stake

1. **Stake Base** (primera operación o después de ITM):
   ```
   stake = capital_actual * risk_per_trade_pct
   ```

2. **Martingala Simple** (después de OTM):
   ```
   stake = stake_anterior * 2
   ```

3. **Martingala Exacta** (preparada en código, comentada):
   ```
   stake = (pérdidas_acumuladas + ganancia_deseada) / profit_pct
   ```

### Stops Automáticos

- **Target Hit**: Cuando `daily_pnl >= daily_target`
- **Stop Loss**: Cuando `daily_pnl <= -max_daily_loss`

### Actualización de Capital

- Al finalizar una sesión (target hit, stop loss o cierre manual), el capital del periodo se actualiza con el capital final de la sesión.

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Admin (requiere rol admin)
- `GET /api/admin/users` - Listar usuarios
- `POST /api/admin/users` - Crear usuario
- `PATCH /api/admin/users/:id` - Actualizar usuario

### Trader (requiere rol trader)
- `GET /api/periods` - Listar periodos
- `POST /api/periods` - Crear periodo
- `GET /api/periods/:id` - Obtener periodo
- `POST /api/periods/:id/sessions` - Crear/iniciar sesión diaria
- `GET /api/sessions/:id` - Obtener sesión
- `POST /api/sessions/:id/trades` - Registrar operación
- `POST /api/sessions/:id/close` - Cerrar sesión

## Roles y Permisos

### Admin
- Gestión de usuarios (crear, activar/desactivar, cambiar contraseñas)
- No puede crear periodos ni operar

### Trader
- Crear y gestionar periodos de trading
- Crear sesiones diarias
- Registrar operaciones
- Ver estadísticas

## Seguridad

- Contraseñas hasheadas con bcrypt
- Sesiones de Express con cookies httpOnly
- Middleware de autenticación y autorización
- Validación de inputs con express-validator
- Protección CSRF mediante sesiones

## Desarrollo

### Agregar Nuevas Funcionalidades

1. Crear modelo en `models/` si es necesario
2. Crear controlador en `controllers/`
3. Crear rutas en `routes/`
4. Agregar middleware de autenticación/autorización si es necesario
5. Actualizar el frontend en `assets/index.html`

### Testing

Para probar la aplicación:

1. Inicia el servidor: `npm start`
2. Accede a `http://localhost:80` (o el puerto configurado)
3. Inicia sesión con el usuario admin creado
4. Crea usuarios traders desde el panel de administración
5. Inicia sesión como trader y crea un periodo de trading
6. Crea una sesión diaria y registra operaciones

## Notas

- El logo debe estar en `assets/img/logo.png` o `assets/logo.png`
- El loader usa el logo para la animación
- Los favicons están en `assets/favicon/`
- El frontend está completamente integrado en un solo archivo HTML para simplicidad

## Licencia

ISC

## Soporte

Para problemas o preguntas, contacta al administrador del sistema.

