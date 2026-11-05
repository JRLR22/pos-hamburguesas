/**
 * Cálculo de dinero, en CENTAVOS enteros. Sin decimales en ningún punto.
 * Se separa del modelo para poder probarlo con Jest sin tocar la base de datos.
 */

/** Subtotal de una línea: (precio del producto + extras) * cantidad */
function calcularSubtotal(precioProducto, extras = [], cantidad = 1) {
  if (!Number.isInteger(precioProducto) || precioProducto < 0) {
    throw new Error('Precio de producto inválido (debe ser entero en centavos)');
  }
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error('Cantidad inválida');
  }
  const precioExtras = extras.reduce((acc, ex) => {
    if (!Number.isInteger(ex.precio) || ex.precio < 0) {
      throw new Error(`Precio inválido en extra "${ex.nombre}"`);
    }
    return acc + ex.precio;
  }, 0);
  return (precioProducto + precioExtras) * cantidad;
}

/** Total del pedido a partir de líneas ya resueltas */
function calcularTotal(itemsResueltos) {
  return itemsResueltos.reduce((acc, it) => acc + it.subtotal, 0);
}

module.exports = { calcularSubtotal, calcularTotal };
