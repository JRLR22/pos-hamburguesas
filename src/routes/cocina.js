const express = require('express');
const pedidoModel = require('../models/pedido');
const auditoria = require('../models/auditoria');
const { requiereLogin, requiereRol } = require('../middleware/auth');
const { validar } = require('../middleware/validar');
const esquemas = require('../schemas');
const { idValido } = require('../utils/id');

const router = express.Router();
router.use(requiereLogin, requiereRol('cocina', 'admin'));

router.get('/', (req, res) => {
  res.json(pedidoModel.listarRecientes());
});

router.patch('/:id', validar(esquemas.estadoCocina), (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de pedido inválido' });
  try {
    pedidoModel.actualizarEstadoCocina(id, req.body.estado);
    auditoria.registrar({
      usuario_id: req.usuario.id,
      accion: 'estado_cocina',
      detalle: `id=${id} estado=${req.body.estado}`,
    });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
