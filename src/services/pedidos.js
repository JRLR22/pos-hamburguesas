/**
 * Capa de servicios: aquí vive la orquestación de negocio.
 * Las rutas solo validan HTTP y llaman aquí; los modelos solo tocan la BD.
 */
const pedidoModel = require('../models/pedido');
const auditoria = require('../models/auditoria');
const { generarComanda, generarTicket } = require('./comanda');
const { imprimirTexto } = require('./impresora');

/**
 * Crea un pedido completo: lo guarda, genera comanda/ticket, intenta
 * imprimir (si está activado) y deja rastro en auditoría.
 * Un fallo de impresora NUNCA debe tumbar la venta: ya quedó en la BD
 * antes de intentar imprimir.
 */
async function crearPedidoCompleto({ items, origen, metodo_pago, cajero_id }) {
  const pedido = pedidoModel.crear({ items, origen, metodo_pago, cajero_id });

  auditoria.registrar({
    usuario_id: cajero_id,
    accion: 'crear_pedido',
    detalle: `id=${pedido.id} total=${pedido.total}`,
  });

  const comanda = generarComanda(pedido);
  const ticket = generarTicket(pedido);

  // omitida = la impresión automática está apagada (no es un error)
  let impresion = { exito: false, omitida: true };
  if (process.env.IMPRIMIR_AUTOMATICO === 'true') {
    impresion = await imprimirTexto(comanda);
  }

  return { pedido, comanda, ticket, impresion };
}

/** Reimprime la comanda de un pedido ya existente */
async function reimprimirPedido(id) {
  const pedido = pedidoModel.obtenerConDetalle(id);
  if (!pedido) return { encontrado: false };

  const resultado = await imprimirTexto(generarComanda(pedido));
  return { encontrado: true, pedido, impresion: resultado };
}

/** Cancela un pedido y deja rastro de quién y por qué (para detectar fraude) */
function cancelarPedido(id, { usuario_id, motivo }) {
  pedidoModel.cancelar(id);
  auditoria.registrar({
    usuario_id,
    accion: 'cancelar_pedido',
    detalle: motivo ? `id=${id} motivo=${motivo}` : `id=${id}`,
  });
}

module.exports = { crearPedidoCompleto, reimprimirPedido, cancelarPedido };
