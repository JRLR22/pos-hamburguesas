const { centavosATexto } = require('./dinero');
const { textoFechaLocal } = require('../utils/fechaLocal');

const NOMBRE_ORIGEN = { didi: 'DIDI FOOD', uber_eats: 'UBER EATS', rappi: 'RAPPI' };

/** Comanda para cocina: solo productos y cantidades, SIN precios */
function generarComanda(pedido) {
  const lineas = [
    '=========================',
    `  COMANDA #${pedido.id}`,
    `  ${textoFechaLocal(pedido.fecha)}`,
    // Pedidos de apps de reparto: la cocina los empaca para llevar
    ...(NOMBRE_ORIGEN[pedido.origen] ? [`  ** ${NOMBRE_ORIGEN[pedido.origen]} **`] : []),
    '=========================',
    ...pedido.items.flatMap((it) => [
      `${it.cantidad} x ${it.producto_nombre}`,
      ...it.extras.map((ex) => `    + ${ex.nombre}`),
    ]),
    '=========================',
  ];
  return lineas.join('\n');
}

/** Ticket para el cliente: con precios y total */
function generarTicket(pedido) {
  const lineas = [
    '=========================',
    `  TICKET #${pedido.id}`,
    `  ${textoFechaLocal(pedido.fecha)}`,
    `  Pago: ${pedido.metodo_pago}`,
    '=========================',
    ...pedido.items.flatMap((it) => [
      `${it.cantidad} x ${it.producto_nombre.padEnd(20)} ${centavosATexto(it.subtotal)}`,
      ...it.extras.map((ex) => `    + ${ex.nombre}`),
    ]),
    '-------------------------',
    `  TOTAL: ${centavosATexto(pedido.total)}`,
    '=========================',
  ];
  return lineas.join('\n');
}

module.exports = { generarComanda, generarTicket };
