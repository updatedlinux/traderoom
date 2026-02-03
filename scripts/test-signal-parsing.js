require('dotenv').config();
const { TradingSignal } = require('../models');

const mockMessage = `
-------------------------------------
**ESTRATEGIA 1 (REVERSION)**

🔴 **POSIBLE ENTRADA PUT**

**Activo:** USDVND-OTCpko
**Expiración:** de 1 a 4 minutos

⚠️ **ESPERAR CIERRE DE VELA ROJA Y RSI ENCIMA DE 70**.

⚠️ **DEBE HABER VISTO EL VIDEO DE ENTRENAMIENTO**.

⚠️ **Entrar solo la primera vez que se dan las condiciones requeridas**. Pasado ese tiempo se debe **DESCARTAR** la entrada.

NO es señal ni consejo de inversión. Lo que usted haga, lo hace bajo su responsabilidad.
-------------------------------------
`;

async function testParsing() {
    console.log('--- Test de Parsing de Señales ---');

    // Regex Patterns (Copied from listener)
    const strategyRegex = /\*\*ESTRATEGIA\s+(.*?)\*\*/i;
    const directionRegex = /POSIBLE ENTRADA\s+(PUT|CALL)/i;
    const pairRegex = /\*\*Activo:\*\*\s+([A-Z0-9-]+)/i;
    const conditionsRegex = /⚠️\s+\*\*(.*?)\*\*/g;

    // Extract Data
    const strategyMatch = mockMessage.match(strategyRegex);
    const directionMatch = mockMessage.match(directionRegex);
    const pairMatch = mockMessage.match(pairRegex);

    let conditions = [];
    let match;
    while ((match = conditionsRegex.exec(mockMessage)) !== null) {
        conditions.push(match[1]);
    }

    console.log('Resultados del Parsing:');
    console.log('Estrategia:', strategyMatch ? strategyMatch[1] : 'No encontrada');
    console.log('Dirección:', directionMatch ? directionMatch[1] : 'No encontrada');
    console.log('Par:', pairMatch ? pairMatch[1] : 'No encontrado');
    console.log('Condiciones:', conditions);

    if (pairMatch && directionMatch) {
        console.log('\nIntentando guardar en BD...');
        try {
            const newSignal = await TradingSignal.create({
                date: new Date(),
                message_id: 'TEST_ID_' + Date.now(),
                raw_message: mockMessage,
                pair: pairMatch[1],
                direction: directionMatch[1],
                strategy: strategyMatch ? strategyMatch[1] : 'Desconocida',
                conditions: conditions.join(' | '),
                expiration: '1 a 4 minutos'
            });
            console.log('✅ Señal guardada en BD con ID:', newSignal.id);
            console.log('Ahora puedes verificar en el frontend.');
        } catch (err) {
            console.error('❌ Error al guardar en BD:', err);
        }
    } else {
        console.log('❌ Falló el parsing de campos obligatorios (Par/Dirección)');
    }

    process.exit();
}

testParsing();
