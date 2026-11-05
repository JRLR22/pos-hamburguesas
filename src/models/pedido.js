const db = require('../db/conexion');
const productoModel = require('./producto');
const extraModel = require('./extra');
const { sqlLocal } = require('../utils/fechaLocal');
const { calcularSubtotal, calcularTotal } = require('../services/calculos');
const { METODOS_PAGO, ORIGENES_PEDIDO: ORIGENES_VALIDOS } = require('../constantes');

function crear({ items, cajero_id, origen = 'local', metodo_pago = 'efectivo' }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('El pedido debe tener al menos un producto');
  }
  if (!cajero_id) throw new Error('Falta el cajero que realiza el pedido');
  if (!METODOS_PAGO.includes(metodo_pago)) throw new Error('Forma de pago inválida');
  if (!ORIGENES_VALIDOS.includes(origen)) throw new Error('Origen del pedido inválido');

  const itemsResueltos = items.map(({ producto_id, cantidad, extra_ids = [] }) => {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new Error(`Cantidad inválida para producto ${producto_id}`);
    }
    const producto = productoModel.obtenerPorId(producto_id);
    if (!producto || producto.activo !== 1) {
      throw new Error(`Producto ${producto_id} no existe o no está disponible`);
    }

    const extrasResueltos = (extra_ids || []).map((extraId) => {
      const extra = extraModel.obtenerPorId(extraId);
      if (!extra || extra.activo !== 1) {
        throw new Error(`Extra ${extraId} no existe o no está disponible`);
      }
      if (!extra.categorias.includes(producto.categoria)) {
        throw new Error(`El extra "${extra.nombre}" no aplica a productos de categoría "${producto.categoria}"`);
      }
      return { id: extra.id, nombre: extra.nombre, precio: extra.precio };
    });

    const subtotal = calcularSubtotal(producto.precio, extrasResueltos, cantidad);

    return { producto_id, cantidad, precio_unitario: producto.precio, subtotal, extras: extrasResueltos };
  });

  const total = calcularTotal(itemsResueltos);

  const insertarTodo = db.transaction(() => {
    const infoPedido = db
      .prepare(
        `
      INSERT INTO pedidos (total, origen, cajero_id, metodo_pago) VALUES (?, ?, ?, ?)
    `
      )
      .run(total, origen, cajero_id, metodo_pago);

    const pedidoId = infoPedido.lastInsertRowid;
    const insertItem = db.prepare(`
      INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertExtra = db.prepare(`
      INSERT INTO pedido_item_extras (pedido_item_id, extra_id, nombre, precio) VALUES (?, ?, ?, ?)
    `);

    for (const it of itemsResueltos) {
      const infoItem = insertItem.run(pedidoId, it.producto_id, it.cantidad, it.precio_unitario, it.subtotal);
      for (const extra of it.extras) {
        insertExtra.run(infoItem.lastInsertRowid, extra.id, extra.nombre, extra.precio);
      }
    }
    return pedidoId;
  });

  const pedidoId = insertarTodo();
  return obtenerConDetalle(pedidoId);
}

function obtenerConDetalle(id) {
  const pedido = db.prepare(`SELECT * FROM pedidos WHERE id = ?`).get(id);
  if (!pedido) return null;

  const items = db
    .prepare(
      `
    SELECT pi.*, p.nombre AS producto_nombre, p.categoria
    FROM pedido_items pi JOIN productos p ON p.id = pi.producto_id
    WHERE pi.pedido_id = ?
  `
    )
    .all(id);

  const extrasStmt = db.prepare(`SELECT nombre, precio FROM pedido_item_extras WHERE pedido_item_id = ?`);
  const itemsConExtras = items.map((it) => ({ ...it, extras: extrasStmt.all(it.id) }));
  return { ...pedido, items: itemsConExtras };
}

function cancelar(id) {
  const pedido = db.prepare(`SELECT estado FROM pedidos WHERE id = ?`).get(id);
  if (!pedido) throw new Error('Pedido no encontrado');
  if (pedido.estado === 'cancelado') throw new Error('El pedido ya estaba cancelado');
  db.prepare(`UPDATE pedidos SET estado = 'cancelado' WHERE id = ?`).run(id);
}

function listarPorFecha(fecha) {
  return db
    .prepare(
      `
    SELECT * FROM pedidos
    WHERE date(${sqlLocal('fecha')}) = date(?)
    ORDER BY fecha DESC
  `
    )
    .all(fecha);
}

function listarRecientes(horas = 2) {
  const pedidos = db
    .prepare(
      `
    SELECT id, fecha, origen, estado_cocina FROM pedidos
    WHERE estado = 'completado' AND datetime(fecha) >= datetime('now', ?)
    ORDER BY (estado_cocina = 'pendiente') DESC, fecha ASC
  `
    )
    .all(`-${horas} hours`);

  const items = db
    .prepare(
      `
    SELECT pi.pedido_id, pi.id, pi.cantidad, p.nombre AS producto_nombre
    FROM pedido_items pi JOIN productos p ON p.id = pi.producto_id
    WHERE pi.pedido_id IN (${pedidos.map(() => '?').join(',') || 'NULL'})
  `
    )
    .all(...pedidos.map((p) => p.id));

  const extrasStmt = db.prepare(`SELECT nombre FROM pedido_item_extras WHERE pedido_item_id = ?`);

  return pedidos.map((pedido) => ({
    ...pedido,
    items: items.filter((it) => it.pedido_id === pedido.id).map((it) => ({ ...it, extras: extrasStmt.all(it.id) })),
  }));
}

function actualizarEstadoCocina(id, estado) {
  const info = db
    .prepare(`UPDATE pedidos SET estado_cocina = ? WHERE id = ? AND estado = 'completado'`)
    .run(estado, id);
  if (info.changes === 0) throw new Error('Pedido no encontrado o cancelado');
}

module.exports = { crear, obtenerConDetalle, cancelar, listarPorFecha, listarRecientes, actualizarEstadoCocina };
