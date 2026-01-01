# TradeRoom

Sistema de gestión de riesgo para trading de opciones binarias y scalping. TradeRoom permite gestionar periodos de trading, sesiones diarias y operaciones con control de riesgo mediante martingala limitada y stops automáticos.

## Descripción

TradeRoom es una aplicación web que facilita la gestión de riesgo en operaciones de trading, inspirada en un sistema de gestión basado en Excel. La aplicación permite:

- **Gestión de usuarios**: Administradores pueden crear y gestionar usuarios traders
- **Periodos de trading**: Configuración de periodos con parámetros personalizables y sobrenombres para identificación
- **Sesiones diarias**: Control de operaciones diarias con stops automáticos
- **Registro de operaciones**: Registro de operaciones ITM/OTM con cálculo automático de stakes y martingala
- **Control de riesgo**: Implementación de martingala limitada y stops de pérdida/ganancia
- **Proyecciones y análisis**: Visualización de PnL proyectado y comparación con resultados reales
- **Estadísticas y reportes**: Generación de reportes Excel y visualización de estadísticas para traders y administradores

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

**Nota**: Puedes generar un `SESSION_SECRET` seguro ejecutando:
```bash
npm run generate:secret
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
- Crea la base de datos si no existe
- Crea todas las tablas necesarias en MariaDB
- Crea el usuario administrador inicial usando las variables `ADMIN_USER` y `ADMIN_PASS` del archivo `.env`

**Importante**: Asegúrate de que las variables `ADMIN_USER` y `ADMIN_PASS` estén configuradas en `.env` antes de ejecutar este comando.

### 4. Scripts Adicionales

Si necesitas agregar columnas adicionales a tablas existentes:

```bash
# Agregar columna payout_real a la tabla trades (si ya existe la tabla)
npm run add:payout-column

# Agregar columna nickname a la tabla trading_periods (si ya existe la tabla)
npm run add:nickname-column
```

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

### Configuración de Sesiones

El sistema está configurado para compartir sesiones entre subdominios mediante cookies con:
- `domain: '.soyjonnymelendez.net'` (compartida entre subdominios)
- `secure: true` (requiere HTTPS)
- `sameSite: 'none'` (permite cross-site)
- `proxy: true` (confía en el proxy reverso)

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
│   ├── traderController.js
│   └── statisticsController.js
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
│   ├── trader.js
│   ├── statistics.js
│   └── telegram.routes.js  # Rutas para el visor de señales de Telegram
├── scripts/           # Scripts de utilidad
│   ├── initDb.js     # Inicialización de base de datos
│   ├── generateSecret.js  # Generador de secretos JWT
│   ├── addPayoutRealColumn.js  # Migración: agregar columna payout_real
│   ├── addNicknameColumn.js    # Migración: agregar columna nickname
│   └── get-telegram-dialogs.js  # Script para obtener IDs de canales de Telegram
├── services/         # Servicios de negocio
│   ├── tradingService.js  # Lógica de trading
│   └── telegram-listener.js  # Listener de mensajes de Telegram
├── server.js         # Servidor principal
├── package.json
├── .env.example
└── README.md
```

## Modelo de Datos

### User
- **Campos**: `id`, `username` (UNIQUE), `password_hash`, `role` ('admin' | 'trader'), `is_active`, `created_at`, `updated_at`
- Usuarios del sistema (admin y trader)
- Autenticación con bcrypt
- Los passwords se hashean automáticamente antes de guardar

### TradingPeriod
- **Campos**: `id`, `user_id` (FK), `start_date`, `end_date`, `initial_capital`, `current_capital`, `daily_target_pct`, `profit_pct`, `risk_per_trade_pct`, `martingale_steps`, `max_daily_loss_pct`, `status` ('active' | 'completed' | 'paused'), `nickname`, `created_at`, `updated_at`
- Periodos de trading con parámetros configurables
- Capital inicial y actual (se actualiza al finalizar sesiones)
- Porcentajes de meta diaria, riesgo por operación, payout esperado, pérdida máxima diaria
- **nickname**: Campo opcional para identificar periodos fácilmente (ej: "IQOption", "Quotex", "Cuenta Demo")
- Relación 1:N con DailySession (eliminación en cascada)

### DailySession
- **Campos**: `id`, `period_id` (FK), `date`, `starting_capital`, `ending_capital`, `daily_pnl`, `num_trades`, `status` ('in_progress' | 'target_hit' | 'stopped_loss' | 'closed'), `created_at`, `updated_at`
- Sesiones diarias de trading
- Control de PnL diario y número de operaciones
- Estados: `in_progress` (activa), `target_hit` (meta alcanzada), `stopped_loss` (stop loss activado), `closed` (cerrada manualmente)
- Relación 1:N con Trade (eliminación en cascada)

### Trade
- **Campos**: `id`, `session_id` (FK), `trade_number`, `stake`, `result` ('ITM' | 'OTM'), `pnl`, `capital_after`, `martingale_step`, `currency_pair`, `payout_real`, `created_at`
- Operaciones individuales
- Registro de stake, resultado (ITM/OTM), PnL
- Control de pasos de martingala (0 = sin martingala, 1+ = paso de martingala)
- **currency_pair**: Par de divisas de la operación (ej: "EUR/USD", "GBP/USD")
- **payout_real**: Payout real de la operación (almacenado para auditoría y análisis histórico)

## Lógica de Trading

### Flujo General

1. **Creación de Periodo**: El trader crea un periodo con fechas, capital inicial y parámetros de riesgo
2. **Inicio de Sesión Diaria**: Cada día, el trader inicia una sesión que toma el capital actual del periodo
3. **Registro de Operaciones**: El trader registra operaciones ITM/OTM, el sistema calcula automáticamente stakes y PnL
4. **Stops Automáticos**: El sistema detiene la sesión cuando se alcanza la meta diaria o el stop loss
5. **Cierre de Sesión**: Al finalizar, el capital del periodo se actualiza con el capital final de la sesión

### Cálculo de Stake

El stake se calcula **dinámicamente** en el backend basándose en el capital actual de la sesión y el estado de martingala:

#### 1. Stake Base (primera operación o después de ITM):
```
stake = capital_actual_de_la_sesión * risk_per_trade_pct
```
Donde `capital_actual_de_la_sesión = starting_capital + daily_pnl`

#### 2. Martingala Simple (después de OTM):
```
stake = stake_anterior * 2
```
Solo se aplica si `martingale_step < martingale_steps` del periodo.

**Ejemplo**:
- Operación 1: OTM con stake $10 → Operación 2: stake $20 (martingala paso 1)
- Operación 2: OTM con stake $20 → Operación 3: stake $40 (martingala paso 2)
- Operación 3: ITM con stake $40 → Operación 4: stake base (martingala reseteada)

#### 3. Martingala Exacta (preparada en código, comentada para uso futuro):
```
stake = (pérdidas_acumuladas + ganancia_deseada) / profit_pct
```

### Cálculo de PnL con Payout Real

El sistema permite registrar el **payout real** de cada operación, permitiendo análisis más precisos:

- **ITM**: `pnl = stake * payout_real` (donde `payout_real` es el porcentaje real de la operación, ej: 0.85 = 85%)
- **OTM**: `pnl = -stake`

El `payout_real` se almacena en cada operación para auditoría y análisis histórico. El frontend permite editar el payout antes de registrar la operación, con un valor por defecto basado en `profit_pct` del periodo.

### Stops Automáticos

El sistema implementa dos tipos de stops automáticos:

#### 1. Target Hit (Meta Alcanzada)
- Se activa cuando `daily_pnl >= daily_target`
- `daily_target = starting_capital * daily_target_pct`
- Estado de sesión: `target_hit`
- **Comportamiento especial**: Si la meta se alcanza, el sistema permite continuar operando (con advertencia), pero no permite operar si el objetivo no se cumplió (OTM)

#### 2. Stop Loss (Pérdida Máxima)
- Se activa cuando `daily_pnl <= -max_daily_loss`
- `max_daily_loss = starting_capital * max_daily_loss_pct`
- Estado de sesión: `stopped_loss`
- **Excepción de Martingala**: Si la operación está en martingala, se permite continuar hasta el último paso de martingala, incluso si temporalmente se excede el `max_daily_loss_pct`. Esto permite completar la estrategia de martingala antes de activar el stop loss.

### Actualización de Capital

- Al finalizar una sesión (target hit, stop loss o cierre manual), el capital del periodo se actualiza con el capital final de la sesión
- El capital se propaga día a día: `period.current_capital` → `session.starting_capital` (día siguiente)

### Manejo de Fechas y Zona Horaria

- El sistema está configurado para trabajar en **GMT-5 (Bogotá, Colombia)**
- Las fechas se almacenan como `DATEONLY` (YYYY-MM-DD) sin componente de tiempo
- El backend usa `timezone: '-05:00'` en la configuración de Sequelize
- El frontend formatea fechas usando `America/Bogota` timezone

## Proyecciones y Análisis de PnL

### PnL Proyectado

El sistema permite visualizar una **proyección de PnL** para cualquier periodo, asumiendo que se cumplen las metas diarias:

- **Cálculo**: Para cada día del periodo, se proyecta:
  - Capital inicial del día = Capital final del día anterior
  - Meta diaria = Capital inicial × `daily_target_pct`
  - Capital final = Capital inicial + Meta diaria
- **Visualización**: Tabla con día, fecha, capital inicial proyectado, meta diaria proyectada y capital final proyectado
- **Uso**: Permite visualizar el crecimiento esperado del capital durante todo el periodo

### PnL Real vs Proyectado

El sistema permite comparar el **PnL real** (de sesiones registradas) contra el **PnL proyectado**:

- **Datos Reales**: Se obtienen de las sesiones diarias registradas en la base de datos
- **Comparación**: Para cada día del periodo:
  - Si hay sesión real: muestra PnL real, capital real y diferencia con lo proyectado
  - Si no hay sesión: muestra "N/A" o valores nulos
- **Visualización**:
  - Tabla comparativa día por día
  - Gráfico de líneas (Chart.js) mostrando evolución del PnL acumulado (proyectado vs real)
  - Métricas: Capital final proyectado vs real, PnL total proyectado vs real, diferencia
- **Uso**: Permite analizar el desempeño real contra las expectativas y ajustar estrategias

## Logs del Sistema

### Logs de Operaciones (Trades)

Cada vez que se registra una operación (ITM u OTM), el sistema genera un log informativo con la siguiente estructura:

```
[TRADE] ITM/OTM - Sesión {sessionId}, Trade #{tradeNumber}
{
  par: "EUR/USD",
  stake: "$12.68",
  payout: "80.00%",
  pnl: "$10.14",
  balancePrevio: "$200.00",
  balancePosterior: "$210.14",
  martingala: "Sí (Paso 1/3)" o "No",
  capitalVariacion: "+$10.14"
}
```

**Información incluida**:
- **Resultado**: ITM o OTM
- **Par de divisas**: Par operado
- **Stake**: Monto de la operación
- **Payout**: Payout real utilizado
- **PnL**: Ganancia o pérdida de la operación
- **Balance Previo**: Capital antes de la operación
- **Balance Posterior**: Capital después de la operación
- **Martingala**: Indica si la operación fue en martingala y en qué paso (ej: "Sí (Paso 1/3)") o "No"
- **Variación de Capital**: Cambio en el capital con signo (+ o -)

Estos logs son útiles para:
- Auditoría de operaciones
- Análisis de desempeño
- Debugging de problemas
- Seguimiento de estrategias de martingala

## 📡 Integración con Telegram (Visor de Señales)

Esta aplicación incluye un visor en tiempo real de mensajes de un canal de Telegram con señales de trading. El sistema se conecta a Telegram como usuario (no como bot) y escucha mensajes de un canal específico, mostrándolos en tiempo real en la interfaz web.

### Configuración Inicial

#### 1. Obtener credenciales de Telegram API

1. Visita [https://my.telegram.org](https://my.telegram.org)
2. Inicia sesión con tu número de teléfono
3. Ve a **API Development Tools**
4. Crea una nueva aplicación:
   - **App title:** TradeRoom Signal Listener
   - **Short name:** traderoom
   - **Platform:** Other
5. Anota los valores de:
   - `api_id` (número)
   - `api_hash` (cadena alfanumérica)

#### 2. Configurar variables de entorno

Edita el archivo `.env` y completa:

```bash
TELEGRAM_API_ID=tu_api_id
TELEGRAM_API_HASH=tu_api_hash
TELEGRAM_PHONE=+57300XXXXXXX
```

#### 3. Obtener Session String y Channel ID

Ejecuta el script auxiliar:

```bash
node scripts/get-telegram-dialogs.js
```

Este script:
- Te pedirá el código de verificación que Telegram envía a tu cuenta
- Si tienes 2FA, pedirá la contraseña
- Mostrará tu `TELEGRAM_SESSION_STRING` (cópialo al `.env`)
- Listará todos tus canales/grupos con sus IDs

Copia el ID del canal de señales y añádelo al `.env`:

```bash
TELEGRAM_SESSION_STRING=tu_session_string_aqui
TELEGRAM_SIGNAL_CHANNEL_ID=-1001234567890
```

**Nota**: El ID del canal puede ser un número negativo (ej: `-1001234567890`). Asegúrate de copiarlo exactamente como aparece.

#### 4. Instalar dependencias

Las dependencias de Telegram se instalan automáticamente con `npm install`, pero si necesitas instalarlas manualmente:

```bash
npm install telegram input socket.io
```

#### 5. Iniciar la aplicación

```bash
npm start
```

El servidor se conectará automáticamente a Telegram y comenzará a escuchar mensajes del canal configurado. Verás en la consola:

```
🔌 Conectando a Telegram como usuario...
✅ Conectado a Telegram
👂 Escuchando mensajes del canal -1001234567890...
```

### Uso

1. Navega a la sección **"Sesión Actual"** en la aplicación
2. Haz clic en el botón **"📡 Ver Señales en vivo"**
3. Se abrirá un modal mostrando:
   - Historial de los últimos 100 mensajes del canal
   - Mensajes nuevos en tiempo real conforme llegan

### Características

- **Buffer en memoria**: Los últimos 200 mensajes se mantienen en memoria
- **Tiempo real**: Los mensajes nuevos aparecen automáticamente sin recargar
- **Sin parseo**: Los mensajes se muestran tal cual llegan del canal
- **Historial**: Al abrir el modal, se cargan los últimos 100 mensajes
- **Auto-scroll**: El contenedor se desplaza automáticamente al recibir nuevos mensajes

### Notas Importantes

- Los mensajes se mantienen solo en memoria (buffer de 200 mensajes)
- Si reinicias el servidor, se perderá el historial anterior
- La conexión a Telegram se mantiene activa mientras el servidor esté corriendo
- No se requiere que el canal sea público; funciona con canales privados a los que tu cuenta tenga acceso
- El sistema no guarda mensajes en la base de datos MariaDB
- Si las variables de Telegram no están configuradas, el listener simplemente no se iniciará (no causará errores)

### Solución de Problemas

**Error: "Telegram listener not initialized"**
- Verifica que las variables `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_PHONE` y `TELEGRAM_SESSION_STRING` estén configuradas en `.env`
- Asegúrate de que `TELEGRAM_SIGNAL_CHANNEL_ID` esté configurado con el ID correcto del canal

**Error: "Error de autenticación"**
- Verifica que el `TELEGRAM_SESSION_STRING` sea válido
- Si es la primera vez, ejecuta `node scripts/get-telegram-dialogs.js` para generar un nuevo session string

**No aparecen mensajes en tiempo real**
- Verifica que el servidor esté conectado a Telegram (revisa los logs del servidor)
- Asegúrate de que el `TELEGRAM_SIGNAL_CHANNEL_ID` sea correcto
- Verifica que tu cuenta de Telegram tenga acceso al canal

**WebSocket no conecta**
- Verifica que Socket.io esté instalado: `npm install socket.io`
- Revisa la consola del navegador para ver errores de conexión

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Admin (requiere rol admin)
- `GET /api/admin/users` - Listar usuarios
- `POST /api/admin/users` - Crear usuario
- `PATCH /api/admin/users/:id` - Actualizar usuario (activar/desactivar, cambiar password)

### Trader (requiere rol trader)
- `GET /api/periods` - Listar periodos del usuario
- `POST /api/periods` - Crear periodo
- `GET /api/periods/:id` - Obtener periodo (con sesiones)
- `PATCH /api/periods/:id` - Actualizar periodo
- `DELETE /api/periods/:id` - Eliminar periodo (elimina en cascada sesiones y trades)
- `POST /api/periods/:id/sessions` - Crear/iniciar sesión diaria
- `GET /api/sessions/:id` - Obtener sesión (con trades y cálculo de próximo stake)
- `POST /api/sessions/:id/trades` - Registrar operación
- `POST /api/sessions/:id/close` - Cerrar sesión manualmente

### Estadísticas
- `GET /api/statistics/trader` - Estadísticas del trader (sesiones cerradas, resumen global)
- `GET /api/statistics/trader/sessions/:id/excel` - Descargar reporte Excel de una sesión
- `GET /api/statistics/admin` - Estadísticas globales para admin (usuarios, periodos, sesiones, trades)
- `GET /api/statistics/admin/users/:userId` - Detalles de un usuario específico (periodos, sesiones, trades)

### Telegram (Visor de Señales)
- `GET /api/telegram/messages?limit=50` - Obtener mensajes recientes del buffer (máximo 200)
- WebSocket: `telegram:new_message` - Evento emitido cuando llega un nuevo mensaje al canal

## Roles y Permisos

### Admin
- Gestión de usuarios (crear, activar/desactivar, cambiar contraseñas)
- Visualización de estadísticas globales y por usuario
- **No puede** crear periodos ni operar

### Trader
- Crear y gestionar periodos de trading (con nickname opcional)
- Editar periodos existentes
- Eliminar periodos (con eliminación en cascada de sesiones y trades)
- Crear sesiones diarias
- Registrar operaciones con payout real editable
- Ver estadísticas propias (sesiones cerradas, resumen)
- Descargar reportes Excel de sesiones
- Visualizar proyecciones de PnL
- Comparar PnL real vs proyectado con gráficos

## Reportes Excel

### Generación de Reportes

Los traders pueden descargar reportes Excel de sus sesiones cerradas desde el módulo de Estadísticas.

### Estructura del Reporte

Cada reporte Excel contiene **3 hojas**:

1. **Información**:
   - Datos del periodo (ID, sobrenombre, rango de fechas, parámetros)
   - Datos de la sesión (fecha, capital inicial/final, PnL, número de operaciones, estado)
   - Resumen de métricas

2. **Operaciones**:
   - Tabla detallada de todas las operaciones
   - Columnas: Número, Hora, Par, Stake, Resultado, Payout Real, PnL, Capital Después, Paso de Martingala
   - Formato: Colores para ITM (verde) y OTM (rojo), números formateados

3. **Datos para Gráficas**:
   - Datos estructurados para crear gráficas manualmente en Excel
   - Incluye instrucciones para el usuario
   - Datos de evolución de capital y PnL acumulado

**Nota**: `exceljs` no soporta creación programática de gráficas, por lo que se proporcionan los datos estructurados para que el usuario cree las gráficas manualmente en Excel.

## Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- Sesiones de Express con cookies httpOnly, secure y sameSite configuradas
- Middleware de autenticación y autorización por roles
- Validación de inputs con express-validator
- Protección CSRF mediante sesiones
- CORS configurado para permitir credenciales entre subdominios
- Normalización de roles (trim y lowercase) para evitar problemas de comparación

## Desarrollo

### Agregar Nuevas Funcionalidades

1. Crear modelo en `models/` si es necesario
2. Crear controlador en `controllers/`
3. Crear rutas en `routes/`
4. Agregar middleware de autenticación/autorización si es necesario
5. Actualizar el frontend en `assets/index.html`

### Scripts de Migración

Si necesitas agregar columnas a tablas existentes, crea un script en `scripts/` siguiendo el patrón de:
- `addPayoutRealColumn.js`: Agrega columna `payout_real` a `trades`
- `addNicknameColumn.js`: Agrega columna `nickname` a `trading_periods`

Luego agrega el script a `package.json` y ejecútalo con `npm run nombre-del-script`.

### Testing

Para probar la aplicación:

1. Inicia el servidor: `npm start`
2. Accede a `http://localhost:80` (o el puerto configurado)
3. Inicia sesión con el usuario admin creado
4. Crea usuarios traders desde el panel de administración
5. Inicia sesión como trader y crea un periodo de trading
6. Crea una sesión diaria y registra operaciones
7. Prueba las proyecciones de PnL y la comparación real vs proyectado
8. Descarga reportes Excel desde el módulo de Estadísticas

## Características Destacadas

### Selector de Periodos en Sesión Actual
- Los traders pueden seleccionar fácilmente entre sus periodos activos desde la sección "Sesión Actual"
- El selector muestra todos los periodos activos del usuario
- Al seleccionar un periodo, se carga automáticamente la sesión del día actual o se permite crear una nueva

### Eliminación en Cascada
- Al eliminar un periodo, se eliminan automáticamente todas sus sesiones diarias y todas las operaciones asociadas
- Esto mantiene la integridad de los datos y evita registros huérfanos

### Payout Real Editable
- El frontend permite editar el payout real antes de registrar cada operación
- Valor por defecto basado en `profit_pct` del periodo
- Permite registrar operaciones con payouts diferentes al esperado (ej: 85% en lugar de 80%)

### Logs Informativos
- Cada operación genera un log estructurado con toda la información relevante
- Facilita auditoría y análisis de desempeño
- Muestra claramente si una operación fue en martingala y en qué paso

## Notas

- El logo principal está en `assets/logo-traderoom.png`
- El icono del loader está en `assets/icon-traderoom.png`
- Los favicons están en `assets/favicon/`
- El frontend está completamente integrado en un solo archivo HTML para simplicidad
- El sistema está optimizado para trabajar en zona horaria GMT-5 (Bogotá)
- Las fechas se manejan como `DATEONLY` (sin componente de tiempo) para evitar problemas de timezone

## Licencia

ISC

## Soporte

Para problemas o preguntas, contacta al administrador del sistema.
