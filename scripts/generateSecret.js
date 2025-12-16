const crypto = require('crypto');

/**
 * Genera un secret aleatorio seguro para JWT/Session
 * 
 * Uso:
 *   node scripts/generateSecret.js
 * 
 * Copia el resultado y pégalo en tu archivo .env como SESSION_SECRET
 */

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

const secret = generateSecret();

console.log('\n========================================');
console.log('JWT/SESSION SECRET GENERADO');
console.log('========================================\n');
console.log('Copia este valor y pégalo en tu archivo .env:');
console.log('\nSESSION_SECRET=' + secret + '\n');
console.log('========================================\n');

