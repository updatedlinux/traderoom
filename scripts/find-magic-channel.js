const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
require('dotenv').config();

(async () => {
    const apiId = parseInt(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH;
    const stringSession = new StringSession(process.env.TELEGRAM_SESSION_STRING || '');

    console.log('🔌 Conectando a Telegram...');

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text('Número de teléfono: '),
        password: async () => await input.text('Contraseña: '),
        phoneCode: async () => await input.text('Código: '),
        onError: (err) => console.log(err),
    });

    const me = await client.getMe();
    console.log(`\n🤖 Conectado como: ${me.firstName} ${me.lastName || ''} (@${me.username || 'sin username'})`);
    console.log(`📞 Teléfono: ${me.phone}`);
    console.log('────────────────────────────────────────────────────────────\n');

    console.log('📋 Buscando canales y sus últimos mensajes...\n');
    const dialogs = await client.getDialogs({ limit: 50 });

    for (const dialog of dialogs) {
        if (dialog.isChannel || dialog.isGroup) {
            const msgs = await client.getMessages(dialog.entity, { limit: 1 });
            const lastMsg = msgs[0];
            const text = lastMsg ? (lastMsg.message || '[Media/Sin texto]') : '[No se pudo leer]';

            // Limpiar saltos de linea para el log
            const cleanText = text.replace(/\n/g, ' ').substring(0, 60);

            console.log(`📢 ${dialog.title}`);
            console.log(`   ID: ${dialog.id}`);
            console.log(`   Último msg: "${cleanText}..."`);

            if (dialog.title.toLowerCase().includes('magic') || text.includes('BUENAS NOCHES')) {
                console.log(`   ✨ ¡COINCIDENCIA PROBABLE! ✨`);
            }
            console.log('────────────────────────────────────────────────────────────');
        }
    }

    await client.disconnect();
})();
