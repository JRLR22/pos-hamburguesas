const db = require('../db/conexion');

const { CATEGORIAS_PRODUCTO: CATEGORIAS_VALIDAS } = require('../constantes');

function conCategoriasComoArray(row) {
  if (!row) return row;
  return { ...row, categorias: row.categorias ? row.categorias.split(',').filter(Boolean) : [] };
}

function validarPrecio(precio) {
  // precio en CENTAVOS: siempre entero, nunca decimal
  if (!Number.isInteger(precio) || precio < 0) {
    throw new Error('El precio debe ser un entero en centavos mayor o igual a 0');
  }
}

function crear({ nombre, precio = 0, categorias = [] }) {
  if (!nombre || !nombre.trim()) throw new Error('El nombre del extra es obligatorio');
  validarPrecio(precio);
  if (!Array.isArray(categorias) || categorias.length === 0) {
    throw new Error('Debes indicar al menos una categoría donde aplica este extra');
  }
  const invalida = categorias.find((c) => !CATEGORIAS_VALIDAS.includes(c));
  if (invalida) throw new Error(`Categoría inválida: ${invalida}`);

  const info = db
    .prepare(
      `
    INSERT INTO extras (nombre, precio, categorias) VALUES (?, ?, ?)
  `
    )
    .run(nombre.trim(), precio, categorias.join(','));

  return obtenerPorId(info.lastInsertRowid);
}

function obtenerPorId(id) {
  return conCategoriasComoArray(db.prepare(`SELECT * FROM extras WHERE id = ?`).get(id));
}

function listarActivos() {
  return db.prepare(`SELECT * FROM extras WHERE activo = 1 ORDER BY nombre`).all().map(conCategoriasComoArray);
}

function listarPorCategoria(categoria) {
  return listarActivos().filter((extra) => extra.categorias.includes(categoria));
}

function actualizar(id, { nombre, precio, categorias }) {
  const existente = obtenerPorId(id);
  if (!existente) throw new Error('Extra no encontrado');
  if (!nombre || !nombre.trim()) throw new Error('El nombre del extra es obligatorio');
  validarPrecio(precio);
  if (!Array.isArray(categorias) || categorias.length === 0) {
    throw new Error('Debes indicar al menos una categoría donde aplica este extra');
  }
  const invalida = categorias.find((c) => !CATEGORIAS_VALIDAS.includes(c));
  if (invalida) throw new Error(`Categoría inválida: ${invalida}`);

  db.prepare(`UPDATE extras SET nombre = ?, precio = ?, categorias = ? WHERE id = ?`).run(
    nombre.trim(),
    precio,
    categorias.join(','),
    id
  );

  return obtenerPorId(id);
}

function desactivar(id) {
  if (!obtenerPorId(id)) throw new Error('Extra no encontrado');
  db.prepare(`UPDATE extras SET activo = 0 WHERE id = ?`).run(id);
}

module.exports = { crear, actualizar, obtenerPorId, listarActivos, listarPorCategoria, desactivar, CATEGORIAS_VALIDAS };
