/**
 * Catálogos del negocio en un solo lugar. Los usan los esquemas de Zod,
 * los modelos y los scripts. Si agregas uno aquí, recuerda también el
 * CHECK correspondiente en db/schema.sql.
 */
const CATEGORIAS_PRODUCTO = ['hamburguesa', 'hotdog', 'boneless', 'bebida', 'extra', 'otro'];
const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];
const ORIGENES_PEDIDO = ['local', 'didi', 'uber_eats', 'rappi'];
const ROLES = ['admin', 'cajero', 'cocina'];
const ESTADOS_COCINA = ['pendiente', 'listo'];

module.exports = { CATEGORIAS_PRODUCTO, METODOS_PAGO, ORIGENES_PEDIDO, ROLES, ESTADOS_COCINA };
