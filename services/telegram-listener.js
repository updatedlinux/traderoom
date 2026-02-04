const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');
const input = require('input');

class TelegramSignalListener {
  constructor(io) {
    this.io = io;
    this.client = null;
    this.bufferSize = 200;
    this.messages = [];

    this.apiId = parseInt(process.env.TELEGRAM_API_ID);
    this.apiHash = process.env.TELEGRAM_API_HASH;
    this.phoneNumber = process.env.TELEGRAM_PHONE;
    this.sessionString = process.env.TELEGRAM_SESSION_STRING || '';
    this.channelId = process.env.TELEGRAM_SIGNAL_CHANNEL_ID;
    this.magicChannelId = process.env.TELEGRAM_MAGIC_CHANNEL_ID || -1001803023509; // ID Trader Magico (fallback si no en env)

    // Validar que las variables requeridas estén configuradas
    if (!this.apiId || !this.apiHash || !this.phoneNumber) {
      console.warn('⚠️  Variables de Telegram no configuradas. El listener no se iniciará.');
      console.warn('   Configura TELEGRAM_API_ID, TELEGRAM_API_HASH y TELEGRAM_PHONE en .env');
    }
  }

  async start() {
    // Si no hay configuración, no iniciar
    if (!this.apiId || !this.apiHash || !this.phoneNumber) {
      console.log('⏭️  Telegram listener omitido (variables no configuradas)');
      return;
    }

    // Si no hay canal configurado, no iniciar
    if (!this.channelId) {
      console.log('⏭️  Telegram listener omitido (TELEGRAM_SIGNAL_CHANNEL_ID no configurado)');
      return;
    }

    try {
      console.log('🔌 Conectando a Telegram como usuario...');

      this.client = new TelegramClient(
        new StringSession(this.sessionString),
        this.apiId,
        this.apiHash,
        {
          connectionRetries: 5,
          useWSS: true,
        }
      );

      await this.client.start({
        phoneNumber: async () => this.phoneNumber,
        password: async () => {
          const password = await input.text('Contraseña 2FA (si aplica, presiona Enter si no tienes): ');
          return password || undefined;
        },
        phoneCode: async () => {
          const code = await input.text('Código de verificación de Telegram: ');
          return code || undefined;
        },
        onError: (err) => console.log('Error de Telegram Client:', err),
      });

      console.log('✅ Conectado a Telegram');

      // Guardar session string si no estaba configurado
      const session = this.client.session.save();
      if (!this.sessionString) {
        console.log('\n📝 Guarda esto en tu .env como TELEGRAM_SESSION_STRING:');
        console.log(session);
        console.log('\n');
      }

      // Convertir channelId a número si es string
      let channelIdNum = this.channelId;
      if (typeof channelIdNum === 'string') {
        channelIdNum = parseInt(channelIdNum);
      }

      let magicIdNum = this.magicChannelId;
      if (typeof magicIdNum === 'string') {
        magicIdNum = parseInt(magicIdNum);
      }

      // Lista de canales a escuchar
      const channelsToListen = [channelIdNum, magicIdNum];

      // Cargar diálogos para asegurar que las entidades sean conocidas (Critico para que el filtro funcione)
      console.log('📚 Cargando lista de chats para inicializar caché...');
      await this.client.getDialogs({});

      // Forzar carga de entidades específicas (Extra robustez)
      try {
        console.log(`🔍 Resolviendo entidades explícitamente: Pocket(${channelIdNum}), Magic(${magicIdNum})`);
        await this.client.getEntity(channelIdNum);
        await this.client.getEntity(magicIdNum);
        console.log('✅ Entidades resueltas y cacheadas.');
      } catch (e) {
        console.warn('⚠️ No se pudieron resolver entidades explícitamente (puede ser normal si ya están en caché o es primera vez):', e.message);
      }

      // Registrar handler para nuevos mensajes
      // Registrar handler para nuevos mensajes
      // NOTA: Usamos un filtro vacío y filtramos manualmente en handleNewMessage
      // Esto es más robusto y evita errores si el ID de Peer != ID de Chat esperado
      this.client.addEventHandler(
        this.handleNewMessage.bind(this),
        new NewMessage({})
      );

      console.log(`👂 Escuchando mensajes de canales: ${channelsToListen.join(', ')}...`);
    } catch (error) {
      console.error('❌ Error al iniciar Telegram listener:', error.message);
      console.error('   Verifica que las variables de entorno estén correctas.');
    }
  }

  async handleNewMessage(event) {
    try {
      const message = event.message;
      const text = message.text || message.message || '';

      if (!text || text.trim() === '') return;

      // Intentar obtener ID del chat de varias formas para ser robustos
      let chatId = ''; // ID que viene en el objeto chat
      try {
        if (message.chat) {
          chatId = message.chat.id.toString();
        } else if (message.peerId) {
          // Si es un canal, peerId.channelId suele estar presente
          if (message.peerId.channelId) chatId = message.peerId.channelId.toString();
        }
      } catch (e) { }

      // Determinar origen
      let source = 'unknown';

      // message.peerId.channelId suele ser BigInt.
      const msgChatId = message.peerId && message.peerId.channelId ? message.peerId.channelId.toString() : chatId;

      // IDs limpios para comparar (sin prefijos)
      const pocketIdStr = this.channelId.toString().replace(/^-100/, '').replace(/^-/, '');
      const magicIdStr = this.magicChannelId.toString().replace(/^-100/, '').replace(/^-/, '');

      // Comparación robusta
      if (msgChatId.includes(pocketIdStr) || (chatId && chatId.includes(pocketIdStr))) {
        source = 'pocket';
      } else if (msgChatId.includes(magicIdStr) || (chatId && chatId.includes(magicIdStr))) {
        source = 'magic';
      }

      if (source === 'unknown') {
        // DEBUG: Ver qué llega que no estamos reconociendo
        // Descomentar para ver todo el tráfico en consola si es necesario
        console.log(`⚠️ Mensaje IGNORADO (Fuente desconocida): ID en evento: ${msgChatId}, ID Chat: ${chatId}. Esperado Magic: ${magicIdStr}`);
        return;
      }

      const messageObj = {
        id: message.id.toString(),
        date: new Date(message.date * 1000).toISOString(),
        text: text,
        fromChannelId: msgChatId,
        source: source // 'pocket' o 'magic'
      };

      // Añadir al buffer (más recientes primero) - Se podría separar buffers si se quisiera
      this.messages.unshift(messageObj);
      if (this.messages.length > this.bufferSize) {
        this.messages.pop();
      }

      console.log(`📨 Nuevo mensaje [${source}]:`, text.substring(0, 50) + (text.length > 50 ? '...' : ''));

      // --- Lógica de Parsing de Señales (SOLO PARA POCKET POR AHORA) ---
      if (source === 'pocket') {
        const { TradingSignal } = require('../models');

        // Regex Patterns
        const strategyRegex = /\*\*ESTRATEGIA\s+(.*?)\*\*/i;
        const directionRegex = /POSIBLE ENTRADA\s+(PUT|CALL)/i;
        const pairRegex = /\*\*Activo:\*\*\s+([A-Z0-9-]+)/i;
        const conditionsRegex = /⚠️\s+\*\*(.*?)\*\*/g;

        // Extract Data
        const strategyMatch = text.match(strategyRegex);
        const directionMatch = text.match(directionRegex);
        const pairMatch = text.match(pairRegex);

        let conditions = [];
        let match;
        while ((match = conditionsRegex.exec(text)) !== null) {
          conditions.push(match[1]);
        }

        // Si es una señal válida (tiene al menos par y dirección), guardar en BD
        if (pairMatch && directionMatch) {
          try {
            const newSignal = await TradingSignal.create({
              date: new Date(), // Fecha actual de recepción
              message_id: messageObj.id,
              raw_message: text,
              pair: pairMatch[1],
              direction: directionMatch[1], // PUT o CALL
              strategy: strategyMatch ? strategyMatch[1] : 'Desconocida',
              conditions: conditions.join(' | '),
              expiration: '1 a 4 minutos' // Default según el formato visto, podría extraerse también
            });
            console.log(`💾 Señal Guardada (Pocket): ${newSignal.pair} ${newSignal.direction} (${newSignal.strategy})`);

            // Añadir datos parseados al objeto que se emite al frontend
            messageObj.parsed = newSignal.toJSON();

          } catch (dbError) {
            console.error('❌ Error guardando señal en BD:', dbError.message);
          }
        }
      }
      // -------------------------------------

      // Emitir por Socket.io (Se emite TODO, el frontend filtra)
      if (this.io) {
        this.io.emit('telegram:new_message', messageObj);
        // También emitir evento específico de señal si se guardó (Solo Pocket)
        if (messageObj.parsed) {
          this.io.emit('telegram:new_signal', messageObj.parsed);
        }
      }
    } catch (error) {
      console.error('❌ Error al procesar mensaje de Telegram:', error.message);
    }
  }

  getRecentMessages(limit = 50) {
    return this.messages.slice(0, Math.min(limit, this.messages.length));
  }

  async stop() {
    if (this.client) {
      try {
        await this.client.disconnect();
        console.log('🔌 Desconectado de Telegram');
      } catch (error) {
        console.error('❌ Error al desconectar de Telegram:', error.message);
      }
    }
  }
}

module.exports = TelegramSignalListener;

