require('dotenv').config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error(
    'ERROR: falta JWT_SECRET en .env (o es demasiado corto, mínimo 32 caracteres).\n' +
      'Genera uno con: npm run secreto'
  );
  process.exit(1);
}

const { crearApp, origenesPermitidos } = require('./src/app');
const sesionModel = require('./src/models/sesion');

const UNA_HORA = 60 * 60 * 1000;
function limpiarSesiones() {
  const borradas = sesionModel.limpiarVencidas();
  if (borradas) console.log(`Sesiones antiguas eliminadas: ${borradas}`);
}
limpiarSesiones();
setInterval(limpiarSesiones, 24 * UNA_HORA).unref();

const PORT = process.env.PORT || 3000;
crearApp().listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log('CORS permitido para:', origenesPermitidos());
});
