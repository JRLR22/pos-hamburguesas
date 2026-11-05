// Crea un usuario directo en la base de datos (útil para el primer admin).
// Uso: npm run crear-usuario -- "Nombre Completo" usuario rol
//   rol: admin | cajero | cocina
// La contraseña se pide por teclado (oculta) para que no quede en el
// historial de la terminal.
require('dotenv').config();
const readline = require('readline');
const usuarioModel = require('../src/models/usuario');
const { ROLES } = require('../src/constantes');

const [, , nombre, usuario, rol] = process.argv;

if (!nombre || !usuario || !ROLES.includes(rol)) {
  console.log('Uso: npm run crear-usuario -- "Nombre Completo" usuario rol');
  console.log(`rol debe ser uno de: ${ROLES.join(', ')}`);
  process.exit(1);
}

function preguntarOculto(pregunta) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.stdoutMuted = false;
    rl._writeToOutput = (texto) => {
      if (!rl.stdoutMuted) rl.output.write(texto);
    };
    rl.question(pregunta, (respuesta) => {
      rl.output.write('\n');
      rl.close();
      resolve(respuesta);
    });
    rl.stdoutMuted = true;
  });
}

(async () => {
  const password = await preguntarOculto('Contraseña (mín. 8 caracteres): ');
  const confirmacion = await preguntarOculto('Repite la contraseña: ');
  if (password !== confirmacion) {
    console.error('❌ Las contraseñas no coinciden');
    process.exit(1);
  }

  try {
    const creado = usuarioModel.crear({ nombre, usuario, password, rol });
    console.log(
      `✅ Usuario creado: "${creado.nombre}" (usuario: ${creado.usuario}, rol: ${creado.rol}, id: ${creado.id})`
    );
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
