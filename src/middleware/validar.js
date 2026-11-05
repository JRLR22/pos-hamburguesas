/**
 * Middleware genérico de validación con Zod. Uso:
 *   router.post('/', validar(esquemas.crearProducto), (req, res) => {...})
 *   router.get('/', validar(esquemas.rangoFechas, 'query'), (req, res) => {...})
 *
 * Si los datos no cumplen el esquema responde 400 con un mensaje claro y la
 * ruta ni siquiera se ejecuta. Los datos ya "parseados" quedan en:
 *   - req.body      (fuente 'body')
 *   - req.consulta  (fuente 'query'; en Express 5 req.query es de solo lectura)
 */
function validar(esquema, fuente = 'body') {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req[fuente] ?? {});
    if (!resultado.success) {
      const primero = resultado.error.issues[0];
      const campo = primero.path.join('.') || fuente;
      return res.status(400).json({ error: `${campo}: ${primero.message}` });
    }
    if (fuente === 'query') req.consulta = resultado.data;
    else req.body = resultado.data;
    next();
  };
}

module.exports = { validar };
