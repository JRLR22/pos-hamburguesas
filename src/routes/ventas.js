const express = require('express');
const ventaModel = require('../models/venta');
const { requiereLogin, requiereRol } = require('../middleware/auth');
const { validar } = require('../middleware/validar');
const esquemas = require('../schemas');
const { hoyLocal } = require('../utils/fechaLocal');

const router = express.Router();
router.use(requiereLogin, requiereRol('admin'));

const conFecha = validar(esquemas.consultaFecha, 'query');

router.get('/dia', conFecha, (req, res) => res.json(ventaModel.totalPorDia(req.consulta.fecha || hoyLocal())));

router.get('/por-cajero', conFecha, (req, res) =>
  res.json(ventaModel.totalPorCajero(req.consulta.fecha || hoyLocal()))
);

router.get('/historial', validar(esquemas.rangoFechas, 'query'), (req, res) => {
  res.json(ventaModel.historial(req.consulta.desde, req.consulta.hasta));
});

router.get('/corte', conFecha, (req, res) => {
  const fecha = req.consulta.fecha || hoyLocal();
  res.json({ fecha, total: ventaModel.totalPorDia(fecha), por_cajero: ventaModel.totalPorCajero(fecha) });
});

module.exports = router;
