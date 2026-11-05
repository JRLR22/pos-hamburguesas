const express = require('express');
const pedidoModel = require('../models/pedido');
const pedidosService = require('../services/pedidos');
const { requiereLogin, requiereRol } = require('../middleware/auth');
const { validar } = require('../middleware/validar');
const esquemas = require('../schemas');
const { idValido } = require('../utils/id');
const { hoyLocal } = require('../utils/fechaLocal');

const router = express.Router();
// Cocina solo consulta comandas (ver routes/cocina.js); vender es de cajeros y admin
router.use(requiereLogin, requiereRol('cajero', 'admin'));

function puedeVerPedido(pedido, usuario) {
  return usuario.rol === 'admin' || pedido.cajero_id === usuario.id;
}

router.post('/', validar(esquemas.crearPedido), async (req, res) => {
  try {
    const { items, origen, metodo_pago } = req.body;
    const resultado = await pedidosService.crearPedidoCompleto({
      items,
      origen,
      metodo_pago,
      cajero_id: req.usuario.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de pedido inválido' });
  const pedido = pedidoModel.obtenerConDetalle(id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  if (!puedeVerPedido(pedido, req.usuario))
    return res.status(403).json({ error: 'No tienes permiso para ver este pedido' });
  res.json(pedido);
});

router.post('/:id/reimprimir', async (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de pedido inválido' });
  const pedido = pedidoModel.obtenerConDetalle(id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  if (!puedeVerPedido(pedido, req.usuario))
    return res.status(403).json({ error: 'No tienes permiso para reimprimir este pedido' });

  const { impresion } = await pedidosService.reimprimirPedido(id);
  if (!impresion.exito) return res.status(502).json({ error: `No se pudo imprimir: ${impresion.error}` });
  res.json({ exito: true });
});

router.delete('/:id', requiereRol('admin'), validar(esquemas.cancelarPedido), (req, res) => {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de pedido inválido' });
  try {
    pedidosService.cancelarPedido(id, { usuario_id: req.usuario.id, motivo: req.body.motivo });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', validar(esquemas.consultaFecha, 'query'), (req, res) => {
  const fecha = req.consulta.fecha || hoyLocal();
  const pedidos = pedidoModel.listarPorFecha(fecha);
  const visibles = req.usuario.rol === 'admin' ? pedidos : pedidos.filter((p) => p.cajero_id === req.usuario.id);
  res.json(visibles);
});

module.exports = router;
