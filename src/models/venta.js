const db = require('../db/conexion');
const { sqlLocal } = require('../utils/fechaLocal');

function totalPorDia(fecha) {
  const row = db
    .prepare(
      `
    SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS pedidos
    FROM pedidos WHERE date(${sqlLocal('fecha')}) = date(?) AND estado = 'completado'
  `
    )
    .get(fecha);
  return { fecha, total: row.total, pedidos: row.pedidos };
}

function totalPorCajero(fecha) {
  return db
    .prepare(
      `
    SELECT u.id AS cajero_id, u.nombre AS cajero_nombre,
           COALESCE(SUM(p.total), 0) AS total, COUNT(p.id) AS pedidos
    FROM usuarios u
    LEFT JOIN pedidos p ON p.cajero_id = u.id
      AND date(${sqlLocal('p.fecha')}) = date(?) AND p.estado = 'completado'
    WHERE u.rol IN ('cajero', 'admin')
    GROUP BY u.id
  `
    )
    .all(fecha);
}

function historial(desde, hasta) {
  return db
    .prepare(
      `
    SELECT date(${sqlLocal('fecha')}) AS dia, COALESCE(SUM(total), 0) AS total, COUNT(*) AS pedidos
    FROM pedidos
    WHERE date(${sqlLocal('fecha')}) BETWEEN date(?) AND date(?) AND estado = 'completado'
    GROUP BY dia ORDER BY dia
  `
    )
    .all(desde, hasta);
}

module.exports = { totalPorDia, totalPorCajero, historial };
