const express = require('express');
const productoModel = require('../models/producto');
const auditoria = require('../models/auditoria');
const { requiereLogin, requiereRol } = require('../middleware/auth');
const { validar } = require('../middleware/validar');
const esquemas = require('../schemas');
const { idValido } = require('../utils/id');

const router = express.Router();
router.use(requiereLogin);

router.get('/', (req, res) => res.json(productoModel.listarActivos()));

router.post('/', requiereRol('admin'), validar(esquemas.crearProducto), (req, res) => {
  try {
    const creado = productoModel.crear(req.body);
    auditoria.registrar({
      usuario_id: req.usuario.id,
      accion: 'crear_producto',
      detalle: `id=${creado.id} nombre=${creado.nombre}`,
    });
    res.status(201).json(creado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requiereRol('admin'), validar(esquemas.editarProducto), (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de producto inválido' });
  try {
    const actualizado = productoModel.actualizar(id, req.body);
    auditoria.registrar({ usuario_id: req.usuario.id, accion: 'editar_producto', detalle: `id=${actualizado.id}` });
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requiereRol('admin'), (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de producto inválido' });
  try {
    productoModel.desactivar(id);
    auditoria.registrar({ usuario_id: req.usuario.id, accion: 'desactivar_producto', detalle: `id=${id}` });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
