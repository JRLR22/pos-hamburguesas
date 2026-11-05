/**
 * El backend habla siempre en centavos (enteros). Este archivo es el
 * ÚNICO lugar donde se convierte entre centavos (API) y pesos (UI).
 * No repitas esta conversión en las páginas.
 */

/** Pesos (lo que escribe el admin en un input, ej. "85.50") -> centavos enteros */
export function pesosACentavos(pesos) {
  const n = Number(pesos);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Centavos (lo que devuelve la API) -> pesos, para prellenar inputs */
export function centavosAPesos(centavos) {
  return Number(centavos) / 100;
}

/** Centavos -> texto con formato de moneda para mostrar en pantalla */
const FORMATO_MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** Centavos -> "$1,234.50" */
export function formatoMoneda(centavos) {
  return FORMATO_MXN.format(centavosAPesos(centavos));
}
