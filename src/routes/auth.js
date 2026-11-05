const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const usuarioModel = require('../models/usuario');
const sesionModel = require('../models/sesion');
const auditoria = require('../models/auditoria');
const { requiereLogin } = require('../middleware/auth');
const { validar } = require('../middleware/validar');
const esquemas = require('../schemas');

const router = express.Router();

const ACCESS_EXPIRES_IN = '15m';
const COOKIE_NOMBRE = 'pos_refresh';
const COOKIE_OPCIONES = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 50,
  skipSuccessfulRequests: true, // solo cuentan los intentos fallidos
  message: { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function firmarAccessToken(usuario) {
  return jwt.sign({ id: usuario.id, usuario: usuario.usuario, rol: usuario.rol }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

router.post('/login', limiteLogin, validar(esquemas.login), (req, res) => {
  const { usuario, password } = req.body;
  const encontrado = usuarioModel.verificarCredenciales(usuario, password);

  if (!encontrado) {
    auditoria.registrar({ accion: 'login_fallido', detalle: `usuario intentado: ${usuario}` });
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const refreshToken = sesionModel.crear(encontrado.id);
  res.cookie(COOKIE_NOMBRE, refreshToken, COOKIE_OPCIONES);
  auditoria.registrar({ usuario_id: encontrado.id, accion: 'login_exitoso' });
  res.json({ token: firmarAccessToken(encontrado), usuario: encontrado });
});

router.post('/refrescar', (req, res) => {
  const tokenActual = req.cookies?.[COOKIE_NOMBRE];
  if (!tokenActual) return res.status(401).json({ error: 'No hay sesión activa' });

  const usuario_id = sesionModel.validar(tokenActual);
  if (!usuario_id) {
    res.clearCookie(COOKIE_NOMBRE, { path: '/auth' });
    return res.status(401).json({ error: 'Sesión expirada, inicia sesión de nuevo' });
  }

  const usuario = usuarioModel.obtenerPorId(usuario_id);
  if (!usuario || usuario.activo !== 1) {
    res.clearCookie(COOKIE_NOMBRE, { path: '/auth' });
    return res.status(401).json({ error: 'Cuenta no disponible' });
  }

  const tokenNuevo = sesionModel.rotar(tokenActual, usuario_id);
  res.cookie(COOKIE_NOMBRE, tokenNuevo, COOKIE_OPCIONES);
  res.json({ token: firmarAccessToken(usuario), usuario });
});

router.post('/logout', (req, res) => {
  const token = req.cookies?.[COOKIE_NOMBRE];
  if (token) sesionModel.revocar(token);
  res.clearCookie(COOKIE_NOMBRE, { path: '/auth' });
  res.status(204).send();
});

router.get('/perfil', requiereLogin, (req, res) => {
  res.json({ usuario: req.usuario });
});

module.exports = router;
