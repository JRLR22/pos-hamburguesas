/** Convierte un parámetro de ruta a ID entero positivo, o null si no es válido */
function idValido(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

module.exports = { idValido };
