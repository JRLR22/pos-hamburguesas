function noEncontrado(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

// Express reconoce un manejador de errores por sus 4 parámetros, aunque _next no se use
function manejadorErrores(err, req, res, _next) {
  // JSON mal formado o cuerpo demasiado grande (lo lanza express.json)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La petición es demasiado grande' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { noEncontrado, manejadorErrores };
