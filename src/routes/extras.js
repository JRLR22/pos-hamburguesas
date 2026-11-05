const express = require('express');
const extraModel = require('../models/extra');
const auditoria = require('../models/auditoria');
const { requiereLogin, requiereRol } = require('../middleware/auth');
const { validar } = require('../middleware/validar');
const esquemas = require('../schemas');
const { idValido } = require('../utils/id');

const router = express.Router();
router.use(requiereLogin);

router.get('/', (req, res) => res.json(extraModel.listarActivos()));

router.post('/', requiereRol('admin'), validar(esquemas.crearExtra), (req, res) => {
  try {
    const creado = extraModel.crear(req.body);
    auditoria.registrar({ usuario_id: req.usuario.id, accion: 'crear_extra', detalle: `id=${creado.id}` });
    res.status(201).json(creado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requiereRol('admin'), validar(esquemas.editarExtra), (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de extra inválido' });
  try {
    const actualizado = extraModel.actualizar(id, req.body);
    auditoria.registrar({ usuario_id: req.usuario.id, accion: 'editar_extra', detalle: `id=${actualizado.id}` });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requiereRol('admin'), (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de extra inválido' });
  try {
    extraModel.desactivar(id);
    auditoria.registrar({ usuario_id: req.usuario.id, accion: 'desactivar_extra', detalle: `id=${id}` });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
