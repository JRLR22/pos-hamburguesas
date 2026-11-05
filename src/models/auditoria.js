const db = require('../db/conexion');

function registrar({ usuario_id = null, accion, detalle = null }) {
  db.prepare(
    `
    INSERT INTO auditoria (usuario_id, accion, detalle)
    VALUES (?, ?, ?)
  `
  ).run(usuario_id, accion, detalle);
}

module.exports = { registrar };
