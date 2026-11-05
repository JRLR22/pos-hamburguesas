const crypto = require('crypto');
const db = require('../db/conexion');

const DIAS_VIGENCIA = 7; // el cajero no vuelve a teclear su password por 7 días de uso normal

/** El refresh token nunca se guarda en texto plano, ni siquiera en nuestra propia BD */
function hashear(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Crea una sesión nueva y devuelve el token en texto plano (solo esta vez) */
function crear(usuario_id) {
  const token = crypto.randomBytes(48).toString('base64url');
  db.prepare(
    `INSERT INTO sesiones (usuario_id, token_hash, expira_en)
     VALUES (?, ?, datetime('now', ?))`
  ).run(usuario_id, hashear(token), `+${DIAS_VIGENCIA} days`);
  return token;
}

/** Valida un refresh token. Devuelve el usuario_id o null si no sirve. */
function validar(token) {
  // datetime() normaliza el formato para comparar como fecha y no como texto
  const fila = db
    .prepare(
      `SELECT usuario_id FROM sesiones
       WHERE token_hash = ? AND revocado = 0 AND datetime(expira_en) > datetime('now')`
    )
    .get(hashear(token));
  return fila ? fila.usuario_id : null;
}

/** Rotación: al refrescar se invalida el token viejo y se emite uno nuevo,
 *  así un refresh token sólo sirve una vez. */
const rotar = db.transaction((tokenViejo, usuario_id) => {
  db.prepare(`UPDATE sesiones SET revocado = 1 WHERE token_hash = ?`).run(hashear(tokenViejo));
  return crear(usuario_id);
});

/** Cierre de sesión: revoca solo este dispositivo */
function revocar(token) {
  db.prepare(`UPDATE sesiones SET revocado = 1 WHERE token_hash = ?`).run(hashear(token));
}

/** Al desactivar un usuario o cambiar su contraseña, cierra TODAS sus sesiones */
function revocarTodasDe(usuario_id) {
  db.prepare(`UPDATE sesiones SET revocado = 1 WHERE usuario_id = ?`).run(usuario_id);
}

/** Limpieza: borra sesiones vencidas o revocadas hace más de 30 días */
function limpiarVencidas() {
  return db
    .prepare(
      `DELETE FROM sesiones
       WHERE datetime(expira_en) < datetime('now', '-30 days')
          OR (revocado = 1 AND datetime(creado_en) < datetime('now', '-30 days'))`
    )
    .run().changes;
}

module.exports = { crear, validar, rotar, revocar, revocarTodasDe, limpiarVencidas };
