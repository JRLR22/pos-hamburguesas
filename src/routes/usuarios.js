const express = require('express');
const usuarioModel = require('../models/usuario');
const sesionModel = require('../models/sesion');
const auditoria = require('../models/auditoria');
const { requiereLogin, requiereRol } = require('../middleware/auth');
const { validar } = require('../middleware/validar');
const esquemas = require('../schemas');
const { idValido } = require('../utils/id');

const router = express.Router();

// Toda esta sección es solo para admin
router.use(requiereLogin, requiereRol('admin'));

/** Cuántos admins activos hay, sin contar (opcionalmente) uno en particular */
function contarAdminsActivos(excluirId = null) {
  return usuarioModel.listarActivos().filter((u) => u.rol === 'admin' && u.id !== excluirId).length;
}

/** GET /usuarios -> todos, activos e inactivos (para administrarlos) */
router.get('/', (req, res) => {
  res.json(usuarioModel.listarTodos());
});

/** POST /usuarios -> crear cajero, cocina o admin */
router.post('/', validar(esquemas.crearUsuario), (req, res) => {
  try {
    const { nombre, usuario, password, rol } = req.body;
    const creado = usuarioModel.crear({ nombre, usuario, password, rol });
    auditoria.registrar({
      usuario_id: req.usuario.id,
      accion: 'crear_usuario',
      detalle: `id=${creado.id} usuario=${creado.usuario} rol=${creado.rol}`,
    });
    res.status(201).json(creado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** PUT /usuarios/:id -> editar nombre y rol */
router.put('/:id', validar(esquemas.editarUsuario), (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de usuario inválido' });
  try {
    const { nombre, rol } = req.body;

    // No dejar que el sistema se quede sin ningún admin activo
    if (rol !== 'admin' && contarAdminsActivos(id) === 0) {
      throw new Error('Debe quedar al menos un administrador activo');
    }

    const actualizado = usuarioModel.actualizar(id, { nombre, rol });
    auditoria.registrar({
      usuario_id: req.usuario.id,
      accion: 'editar_usuario',
      detalle: `id=${id} nombre=${nombre} rol=${rol}`,
    });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** PUT /usuarios/:id/password -> restablecer contraseña (admin la define) */
router.put('/:id/password', validar(esquemas.cambiarPassword), (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de usuario inválido' });
  try {
    usuarioModel.cambiarPassword(id, req.body.password);
    // Cierra sus otras sesiones (si es tu propia cuenta, conservas la actual)
    if (id !== req.usuario.id) sesionModel.revocarTodasDe(id);
    // No registramos la contraseña en el detalle, solo el hecho de que cambió
    auditoria.registrar({
      usuario_id: req.usuario.id,
      accion: 'restablecer_password',
      detalle: `id=${id}`,
    });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** DELETE /usuarios/:id -> baja lógica */
router.delete('/:id', (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de usuario inválido' });

  // Nadie puede darse de baja a sí mismo desde aquí (te quedarías fuera)
  if (id === req.usuario.id) {
    return res.status(400).json({ error: 'No puedes dar de baja tu propia cuenta' });
  }

  try {
    const objetivo = usuarioModel.obtenerPorId(id);
    if (objetivo?.rol === 'admin' && contarAdminsActivos(id) === 0) {
      throw new Error('Debe quedar al menos un administrador activo');
    }
    usuarioModel.desactivar(id);
    sesionModel.revocarTodasDe(id); // que no pueda seguir usando el sistema con el token que ya tenía
    auditoria.registrar({ usuario_id: req.usuario.id, accion: 'desactivar_usuario', detalle: `id=${id}` });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** POST /usuarios/:id/reactivar */
router.post('/:id/reactivar', (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de usuario inválido' });
  try {
    usuarioModel.reactivar(id);
    auditoria.registrar({ usuario_id: req.usuario.id, accion: 'reactivar_usuario', detalle: `id=${id}` });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
