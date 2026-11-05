function centavosATexto(centavos) {
  return `$${(centavos / 100).toFixed(2)}`;
}

module.exports = { centavosATexto };
