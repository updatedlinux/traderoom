const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');
const input = require('input');
require('dotenv').config();

(async () => {
    const apiId = parseInt(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH;
    const stringSession = new StringSession(process.env.TELEGRAM_SESSION_STRING || '');
    const MAGIC_ID = -1001803023509; // ID Confirmado

    console.log('🧪 Iniciando TEST de Escucha para TRADER MAGICO (-1001803023509)...');

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text('Número de teléfono: '),
        password: async () => await input.text('Contraseña: '),
        phoneCode: async () => await input.text('Código: '),
        onError: (err) => console.log(err),
    });

    console.log('✅ Cliente conectado.');

    // 1. Forzar resolución de la entidad
    try {
        console.log('🔍 Resolviendo entidad del canal...');
        const entity = await client.getEntity(MAGIC_ID);
        console.log(`✅ Entidad Resuelta: ${entity.title} (ID: ${entity.id.toString()})`);
    } catch (e) {
        console.error('❌ Error resolviendo entidad:', e);
    }

    // 2. Escuchar TODO
    console.log('👂 Escuchando eventos (Esperando mensajes)...');

    client.addEventHandler(async (event) => {
        const message = event.message;
        if (!message) return;

        const senderId = message.peerId ? (message.peerId.channelId || message.peerId.userId || 'unknown') : 'unknown';
        const text = message.message || '[Sin texto]';

        console.log('------------------------------------------------');
        console.log(`📨 EVENTO RECIBIDO`);
        console.log(`   ID Chat/Canal: ${senderId.toString()}`);
        console.log(`   Texto: ${text.substring(0, 50)}...`);

        // Check match
        const magicIdStr = MAGIC_ID.toString().replace('-100', '');
        if (senderId.toString() === magicIdStr || senderId.toString() === MAGIC_ID.toString()) {
            console.log('   ✨ ¡ES DE TRADER MAGICO! ✨');
        } else {
            console.log(`   ⚠️ No coincide con Magic (${magicIdStr})`);
        }

    }, new NewMessage({}));

    // 3. Polling de respaldo para diagnóstico
    console.log('🔄 Iniciando Polling cada 10s para verificar historial...');
    setInterval(async () => {
        try {
            const msgs = await client.getMessages(MAGIC_ID, { limit: 1 });
            if (msgs && msgs.length > 0) {
                const m = msgs[0];
                console.log(`[POLL] Último msg ID=${m.id}: ${m.message ? m.message.substring(0, 30).replace(/\n/g, ' ') : '[Sin texto]'}...`);
            }
        } catch (e) {
            console.error('[POLL] Error:', e.message);
        }
    }, 10000);

    // Mantener vivo
    await new Promise(() => { });
})();
