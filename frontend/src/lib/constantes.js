// Deben coincidir con src/constantes.js del backend.
export const CATEGORIAS_PRODUCTO = ['hamburguesa', 'hotdog', 'boneless', 'bebida', 'extra', 'otro'];
export const ROLES = ['cajero', 'cocina', 'admin'];

export const METODOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
];

export const ORIGENES_PEDIDO = [
  { valor: 'local', etiqueta: 'Local' },
  { valor: 'didi', etiqueta: 'DiDi Food' },
  { valor: 'uber_eats', etiqueta: 'Uber Eats' },
  { valor: 'rappi', etiqueta: 'Rappi' },
];

export const etiquetaOrigen = (valor) => ORIGENES_PEDIDO.find((o) => o.valor === valor)?.etiqueta ?? valor;
