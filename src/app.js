/**
 * Construye la app de Express sin levantar el servidor, para poder
 * probarla con supertest (ver tests/api.test.js).
 */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const pedidosRoutes = require('./routes/pedidos');
const ventasRoutes = require('./routes/ventas');
const extrasRoutes = require('./routes/extras');
const cocinaRoutes = require('./routes/cocina');
const usuariosRoutes = require('./routes/usuarios');
const { noEncontrado, manejadorErrores } = require('./middleware/errores');

function origenesPermitidos() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function crearApp() {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

  app.use(helmet());
  app.use(cors({ origin: origenesPermitidos(), credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: Number(process.env.RATE_LIMIT_MAX || 1000),
      message: { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health',
    })
  );

  app.get('/health', (req, res) => res.json({ ok: true, hora: new Date().toISOString() }));

  app.use('/auth', authRoutes);
  app.use('/productos', productosRoutes);
  app.use('/pedidos', pedidosRoutes);
  app.use('/ventas', ventasRoutes);
  app.use('/extras', extrasRoutes);
  app.use('/cocina', cocinaRoutes);
  app.use('/usuarios', usuariosRoutes);

  app.use(noEncontrado);
  app.use(manejadorErrores);
  return app;
}

module.exports = { crearApp, origenesPermitidos };
