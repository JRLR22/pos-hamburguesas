const db = require('../db/conexion');

const { CATEGORIAS_PRODUCTO: CATEGORIAS_VALIDAS } = require('../constantes');

function validar({ nombre, categoria, precio }) {
  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    throw new Error('El nombre es obligatorio');
  }
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    throw new Error(`Categoría inválida. Debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}`);
  }
  // precio en CENTAVOS: siempre entero, nunca decimal
  if (!Number.isInteger(precio) || precio < 0) {
    throw new Error('El precio debe ser un entero en centavos mayor o igual a 0');
  }
}

function crear({ nombre, categoria, precio }) {
  validar({ nombre, categoria, precio });

  const stmt = db.prepare(`
    INSERT INTO productos (nombre, categoria, precio)
    VALUES (@nombre, @categoria, @precio)
  `);
  const info = stmt.run({ nombre: nombre.trim(), categoria, precio });
  return obtenerPorId(info.lastInsertRowid);
}

function obtenerPorId(id) {
  return db.prepare(`SELECT * FROM productos WHERE id = ?`).get(id) || null;
}

function listarActivos() {
  return db.prepare(`SELECT * FROM productos WHERE activo = 1 ORDER BY categoria, nombre`).all();
}

function actualizar(id, { nombre, categoria, precio }) {
  const existente = obtenerPorId(id);
  if (!existente) throw new Error('Producto no encontrado');

  validar({ nombre, categoria, precio });

  db.prepare(
    `
    UPDATE productos SET nombre = ?, categoria = ?, precio = ?
    WHERE id = ?
  `
  ).run(nombre.trim(), categoria, precio, id);

  return obtenerPorId(id);
}

function desactivar(id) {
  const existente = obtenerPorId(id);
  if (!existente) throw new Error('Producto no encontrado');
  db.prepare(`UPDATE productos SET activo = 0 WHERE id = ?`).run(id);
}

module.exports = {
  crear,
  obtenerPorId,
  listarActivos,
  actualizar,
  desactivar,
  CATEGORIAS_VALIDAS,
};
