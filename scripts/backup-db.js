// Respaldo en caliente de la base de datos (seguro aunque el servidor esté corriendo).
// Uso: npm run backup  -> crea respaldos/pos-YYYY-MM-DD_HH-MM-SS.db
// Conserva solo los últimos MAX_RESPALDOS archivos.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/db/conexion');

const DIR_RESPALDOS = path.join(__dirname, '..', 'respaldos');
const MAX_RESPALDOS = 30;

(async () => {
  fs.mkdirSync(DIR_RESPALDOS, { recursive: true });

  const sello = new Date().toISOString().replace('T', '_').replace(/:/g, '-').slice(0, 19);
  const destino = path.join(DIR_RESPALDOS, `pos-${sello}.db`);

  await db.backup(destino);
  db.close();
  console.log(`✅ Respaldo creado: ${destino}`);

  const viejos = fs
    .readdirSync(DIR_RESPALDOS)
    .filter((f) => f.startsWith('pos-') && f.endsWith('.db'))
    .sort()
    .slice(0, -MAX_RESPALDOS);
  for (const f of viejos) fs.unlinkSync(path.join(DIR_RESPALDOS, f));
  if (viejos.length) console.log(`🧹 Se eliminaron ${viejos.length} respaldos antiguos`);
})().catch((err) => {
  console.error('❌ Error al respaldar:', err.message);
  process.exit(1);
});
