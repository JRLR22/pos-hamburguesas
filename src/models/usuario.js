const bcrypt = require('bcrypt');
const db = require('../db/conexion');

const SALT_ROUNDS = 12; // costo de hash: seguro y con rendimiento razonable
const { ROLES: ROLES_VALIDOS } = require('../constantes');

/**
 * Crea un nuevo usuario (cajero, cocina o admin).
 * La contraseña se recibe en texto plano y se guarda SIEMPRE hasheada.
 */
function crear({ nombre, usuario, password, rol }) {
  if (!nombre || !usuario || !password || !rol) {
    throw new Error('Faltan datos obligatorios: nombre, usuario, password, rol');
  }
  if (!ROLES_VALIDOS.includes(rol)) {
    throw new Error('Rol inválido');
  }
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  const existente = db.prepare(`SELECT id FROM usuarios WHERE usuario = ?`).get(usuario);
  if (existente) {
    throw new Error('Ese nombre de usuario ya existe');
  }

  const password_hash = bcrypt.hashSync(password, SALT_ROUNDS);

  const stmt = db.prepare(`
    INSERT INTO usuarios (nombre, usuario, password_hash, rol)
    VALUES (@nombre, @usuario, @password_hash, @rol)
  `);

  const info = stmt.run({ nombre: nombre.trim(), usuario: usuario.trim(), password_hash, rol });
  return obtenerPorId(info.lastInsertRowid);
}

/**
 * Verifica usuario/contraseña. Devuelve el usuario (sin el hash) si es válido,
 * o null si las credenciales son incorrectas.
 * IMPORTANTE: nunca revelar si falló el "usuario" o el "password" por separado,
 * para no facilitar ataques de enumeración de usuarios.
 */
function verificarCredenciales(usuario, password) {
  const row = db.prepare(`SELECT * FROM usuarios WHERE usuario = ? AND activo = 1`).get(usuario);
  if (!row) return null;

  const passwordValido = bcrypt.compareSync(password, row.password_hash);
  if (!passwordValido) return null;

  return sinPasswordHash(row);
}

function obtenerPorId(id) {
  const row = db.prepare(`SELECT * FROM usuarios WHERE id = ?`).get(id);
  return row ? sinPasswordHash(row) : null;
}

function listarActivos() {
  return db.prepare(`SELECT * FROM usuarios WHERE activo = 1 ORDER BY nombre`).all().map(sinPasswordHash);
}

/** Para la pantalla de admin: TODOS los usuarios, activos e inactivos */
function listarTodos() {
  return db.prepare(`SELECT * FROM usuarios ORDER BY activo DESC, rol, nombre`).all().map(sinPasswordHash);
}

/** Edita nombre y/o rol. No toca la contraseña (eso es un endpoint aparte). */
function actualizar(id, { nombre, rol }) {
  const existente = obtenerPorId(id);
  if (!existente) throw new Error('Usuario no encontrado');
  if (!nombre || !nombre.trim()) throw new Error('El nombre es obligatorio');
  if (!ROLES_VALIDOS.includes(rol)) throw new Error('Rol inválido');

  db.prepare(`UPDATE usuarios SET nombre = ?, rol = ? WHERE id = ?`).run(nombre.trim(), rol, id);
  return obtenerPorId(id);
}

/** Cambia la contraseña de un usuario (usado por admin o por "cambiar mi contraseña") */
function cambiarPassword(id, passwordNueva) {
  const existente = obtenerPorId(id);
  if (!existente) throw new Error('Usuario no encontrado');
  if (!passwordNueva || passwordNueva.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }
  const password_hash = bcrypt.hashSync(passwordNueva, SALT_ROUNDS);
  db.prepare(`UPDATE usuarios SET password_hash = ? WHERE id = ?`).run(password_hash, id);
}

/** Deshabilita un usuario sin borrarlo (por historial de ventas ligado a él) */
function desactivar(id) {
  const existente = obtenerPorId(id);
  if (!existente) throw new Error('Usuario no encontrado');
  db.prepare(`UPDATE usuarios SET activo = 0 WHERE id = ?`).run(id);
}

/** Reactiva a un usuario dado de baja previamente */
function reactivar(id) {
  const existente = obtenerPorId(id);
  if (!existente) throw new Error('Usuario no encontrado');
  db.prepare(`UPDATE usuarios SET activo = 1 WHERE id = ?`).run(id);
}

/** Nunca devolver password_hash fuera de este archivo */
function sinPasswordHash(row) {
  const { password_hash, ...resto } = row;
  return resto;
}

module.exports = {
  crear,
  verificarCredenciales,
  obtenerPorId,
  listarActivos,
  listarTodos,
  actualizar,
  cambiarPassword,
  desactivar,
  reactivar,
  ROLES_VALIDOS,
};
