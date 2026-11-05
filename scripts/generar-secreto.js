// Genera un secreto aleatorio para JWT_SECRET.
// Uso: npm run secreto  -> copia el resultado a tu archivo .env
const crypto = require('crypto');

console.log(crypto.randomBytes(48).toString('base64url'));
