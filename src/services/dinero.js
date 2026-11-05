/** Centavos -> "$1,234.50" (ASCII puro para que la impresora térmica no tenga problemas) */
function centavosATexto(centavos) {
  const [enteros, decimales] = (centavos / 100).toFixed(2).split('.');
  return `$${enteros.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimales}`;
}

module.exports = { centavosATexto };
