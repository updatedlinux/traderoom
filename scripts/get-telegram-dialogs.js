const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
require('dotenv').config();

(async () => {
  const apiId = parseInt(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const phoneNumber = process.env.TELEGRAM_PHONE;
  const sessionString = process.env.TELEGRAM_SESSION_STRING || '';

  if (!apiId || !apiHash || !phoneNumber) {
    console.error('❌ Error: Configura TELEGRAM_API_ID, TELEGRAM_API_HASH y TELEGRAM_PHONE en .env');
    process.exit(1);
  }

  const client = new TelegramClient(
    new StringSession(sessionString),
    apiId,
    apiHash,
    { connectionRetries: 5, useWSS: true }
  );

  try {
    await client.start({
      phoneNumber: async () => phoneNumber,
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

    const session = client.session.save();
    if (!sessionString) {
      console.log('\n📝 Guarda esto en tu .env como TELEGRAM_SESSION_STRING:');
      console.log(session);
      console.log('\n');
    }

    console.log('\n📋 Obteniendo lista de canales y grupos...\n');
    const dialogs = await client.getDialogs({ limit: 100 });

    console.log('📋 Tus canales/grupos de Telegram:\n');
    console.log('─'.repeat(60));
    
    const channels = [];
    dialogs.forEach((dialog) => {
      if (dialog.isChannel || dialog.isGroup) {
        const type = dialog.isChannel ? 'Canal' : 'Grupo';
        console.log(`${type}: ${dialog.title}`);
        console.log(`   ID: ${dialog.id}`);
        console.log(`   Username: ${dialog.entity.username || 'N/A'}`);
        console.log('─'.repeat(60));
        channels.push({ id: dialog.id, title: dialog.title, type, username: dialog.entity.username });
      }
    });

    if (channels.length === 0) {
      console.log('No se encontraron canales o grupos.');
    } else {
      console.log(`\n✅ Total: ${channels.length} canales/grupos encontrados`);
      console.log('\n💡 Copia el ID del canal de señales y añádelo a .env como:');
      console.log('   TELEGRAM_SIGNAL_CHANNEL_ID=<ID_DEL_CANAL>');
    }

    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.disconnect();
    process.exit(1);
  }
})();

