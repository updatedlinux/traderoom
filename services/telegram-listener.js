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
          return code;
        },
        onError: (err) => console.error('❌ Error de autenticación:', err),
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

      // Registrar handler para nuevos mensajes
      this.client.addEventHandler(
        this.handleNewMessage.bind(this),
        new NewMessage({ chats: [channelIdNum] })
      );

      console.log(`👂 Escuchando mensajes del canal ${this.channelId}...`);
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

      const messageObj = {
        id: message.id.toString(),
        date: new Date(message.date * 1000).toISOString(),
        text: text,
        fromChannelId: this.channelId,
      };

      // Añadir al buffer (más recientes primero)
      this.messages.unshift(messageObj);
      if (this.messages.length > this.bufferSize) {
        this.messages.pop();
      }

      console.log('📨 Nuevo mensaje:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

      // --- Lógica de Parsing de Señales ---
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
          console.log(`💾 Señal Guardada: ${newSignal.pair} ${newSignal.direction} (${newSignal.strategy})`);

          // Añadir datos parseados al objeto que se emite al frontend
          messageObj.parsed = newSignal.toJSON();

        } catch (dbError) {
          console.error('❌ Error guardando señal en BD:', dbError.message);
        }
      }
      // -------------------------------------

      // Emitir por Socket.io
      if (this.io) {
        this.io.emit('telegram:new_message', messageObj);
        // También emitir evento específico de señal si se guardó
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

