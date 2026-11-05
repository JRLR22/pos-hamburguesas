const request = require('supertest');
const { crearApp } = require('../src/app');
const usuarioModel = require('../src/models/usuario');
const productoModel = require('../src/models/producto');
const extraModel = require('../src/models/extra');

const app = crearApp();
const PASSWORD = 'clave-de-prueba-123';

let admin, cajero, otroCajero, cocina;
let hamburguesa, refresco, queso;

async function login(usuario) {
  const res = await request(app).post('/auth/login').send({ usuario, password: PASSWORD });
  return { token: res.body.token, cookie: res.headers['set-cookie'], res };
}

const conToken = (token) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  usuarioModel.crear({ nombre: 'Admin', usuario: 'admin', password: PASSWORD, rol: 'admin' });
  usuarioModel.crear({ nombre: 'Ana Caja', usuario: 'ana', password: PASSWORD, rol: 'cajero' });
  usuarioModel.crear({ nombre: 'Beto Caja', usuario: 'beto', password: PASSWORD, rol: 'cajero' });
  usuarioModel.crear({ nombre: 'Cocina', usuario: 'cocina', password: PASSWORD, rol: 'cocina' });

  hamburguesa = productoModel.crear({ nombre: 'Hamburguesa', categoria: 'hamburguesa', precio: 12000 });
  refresco = productoModel.crear({ nombre: 'Refresco', categoria: 'bebida', precio: 3000 });
  queso = extraModel.crear({ nombre: 'Queso extra', precio: 1500, categorias: ['hamburguesa'] });

  [admin, cajero, otroCajero, cocina] = await Promise.all(['admin', 'ana', 'beto', 'cocina'].map(login));
});

describe('autenticación', () => {
  test('credenciales incorrectas → 401 sin revelar cuál dato falló', async () => {
    const res = await request(app).post('/auth/login').send({ usuario: 'admin', password: 'mala' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Usuario o contraseña incorrectos');
  });

  test('login exitoso entrega access token y refresh token en cookie httpOnly', () => {
    expect(admin.res.status).toBe(200);
    expect(admin.token).toEqual(expect.any(String));
    expect(admin.res.body.usuario).not.toHaveProperty('password_hash');
    expect(admin.cookie[0]).toMatch(/pos_refresh=.+HttpOnly/i);
    expect(admin.cookie[0]).toMatch(/SameSite=Strict/i);
  });

  test('sin token → 401', async () => {
    const res = await request(app).get('/productos');
    expect(res.status).toBe(401);
  });

  test('el refresh token rota: el anterior ya no sirve', async () => {
    const sesion = await login('ana');
    const primero = await request(app).post('/auth/refrescar').set('Cookie', sesion.cookie);
    expect(primero.status).toBe(200);
    expect(primero.body.token).toEqual(expect.any(String));

    const reutilizado = await request(app).post('/auth/refrescar').set('Cookie', sesion.cookie);
    expect(reutilizado.status).toBe(401);
  });

  test('logout revoca el refresh token', async () => {
    const sesion = await login('ana');
    await request(app).post('/auth/logout').set('Cookie', sesion.cookie).expect(204);
    const res = await request(app).post('/auth/refrescar').set('Cookie', sesion.cookie);
    expect(res.status).toBe(401);
  });
});

describe('permisos por rol', () => {
  test('un cajero no puede modificar el catálogo', async () => {
    const res = await request(app)
      .post('/productos')
      .set(conToken(cajero.token))
      .send({ nombre: 'Gratis', categoria: 'otro', precio: 0 });
    expect(res.status).toBe(403);
  });

  test('un cajero no puede ver reportes de ventas', async () => {
    const res = await request(app).get('/ventas/dia').set(conToken(cajero.token));
    expect(res.status).toBe(403);
  });

  test('cocina no puede registrar ventas', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set(conToken(cocina.token))
      .send({ items: [{ producto_id: refresco.id, cantidad: 1 }] });
    expect(res.status).toBe(403);
  });

  test('cocina sí puede consultar comandas', async () => {
    const res = await request(app).get('/cocina').set(conToken(cocina.token));
    expect(res.status).toBe(200);
  });
});

describe('pedidos', () => {
  test('el total se calcula en el servidor con los precios de la BD', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set(conToken(cajero.token))
      .send({
        items: [
          { producto_id: hamburguesa.id, cantidad: 2, extra_ids: [queso.id], precio: 1 }, // "precio" del cliente se ignora
          { producto_id: refresco.id, cantidad: 1 },
        ],
        origen: 'didi',
        metodo_pago: 'tarjeta',
      });

    expect(res.status).toBe(201);
    // (120.00 + 15.00) * 2 + 30.00 = 300.00
    expect(res.body.pedido.total).toBe(30000);
    expect(res.body.pedido.origen).toBe('didi');
    expect(res.body.comanda).not.toMatch(/\$/); // la comanda de cocina no lleva precios
    expect(res.body.ticket).toContain('$300.00');
  });

  test('rechaza un extra que no aplica a la categoría del producto', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set(conToken(cajero.token))
      .send({ items: [{ producto_id: refresco.id, cantidad: 1, extra_ids: [queso.id] }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no aplica/);
  });

  test('valida el cuerpo con Zod antes de llegar a la lógica', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set(conToken(cajero.token))
      .send({ items: [{ producto_id: refresco.id, cantidad: 1.5 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^items\.0\.cantidad/);
  });

  test('JSON mal formado → 400', async () => {
    const res = await request(app)
      .post('/pedidos')
      .set(conToken(cajero.token))
      .set('Content-Type', 'application/json')
      .send('{"items": [');
    expect(res.status).toBe(400);
  });

  test('un cajero no puede ver pedidos de otro cajero', async () => {
    const creado = await request(app)
      .post('/pedidos')
      .set(conToken(cajero.token))
      .send({ items: [{ producto_id: refresco.id, cantidad: 1 }] });

    const ajeno = await request(app).get(`/pedidos/${creado.body.pedido.id}`).set(conToken(otroCajero.token));
    expect(ajeno.status).toBe(403);

    const lista = await request(app).get('/pedidos').set(conToken(otroCajero.token));
    expect(lista.body.every((p) => p.cajero_id === otroCajero.res.body.usuario.id)).toBe(true);
  });
});

describe('cancelaciones y reportes', () => {
  test('cancelar descuenta la venta del corte y no se puede cancelar dos veces', async () => {
    const antes = await request(app).get('/ventas/dia').set(conToken(admin.token));

    const creado = await request(app)
      .post('/pedidos')
      .set(conToken(cajero.token))
      .send({ items: [{ producto_id: hamburguesa.id, cantidad: 1 }] });
    const id = creado.body.pedido.id;

    const conVenta = await request(app).get('/ventas/dia').set(conToken(admin.token));
    expect(conVenta.body.total).toBe(antes.body.total + 12000);

    await request(app)
      .delete(`/pedidos/${id}`)
      .set(conToken(admin.token))
      .send({ motivo: 'Error de captura' })
      .expect(204);

    const despues = await request(app).get('/ventas/dia').set(conToken(admin.token));
    expect(despues.body.total).toBe(antes.body.total);

    const otraVez = await request(app).delete(`/pedidos/${id}`).set(conToken(admin.token)).send({});
    expect(otraVez.status).toBe(400);
  });

  test('cocina no puede marcar como listo un pedido cancelado', async () => {
    const creado = await request(app)
      .post('/pedidos')
      .set(conToken(cajero.token))
      .send({ items: [{ producto_id: refresco.id, cantidad: 1 }] });
    const id = creado.body.pedido.id;
    await request(app).delete(`/pedidos/${id}`).set(conToken(admin.token)).send({}).expect(204);

    const res = await request(app).patch(`/cocina/${id}`).set(conToken(cocina.token)).send({ estado: 'listo' });
    expect(res.status).toBe(400);
  });

  test('valida el formato de fecha en los reportes', async () => {
    const res = await request(app).get('/ventas/dia?fecha=ayer').set(conToken(admin.token));
    expect(res.status).toBe(400);

    const rango = await request(app)
      .get('/ventas/historial?desde=2026-02-01&hasta=2026-01-01')
      .set(conToken(admin.token));
    expect(rango.status).toBe(400);
  });
});

describe('usuarios', () => {
  test('no permite quedarse sin administradores', async () => {
    const res = await request(app)
      .put(`/usuarios/${admin.res.body.usuario.id}`)
      .set(conToken(admin.token))
      .send({ nombre: 'Admin', rol: 'cajero' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/al menos un administrador/);
  });

  test('dar de baja a un usuario cierra sus sesiones', async () => {
    const nuevo = await request(app)
      .post('/usuarios')
      .set(conToken(admin.token))
      .send({ nombre: 'Temporal', usuario: 'temporal', password: PASSWORD, rol: 'cajero' });
    expect(nuevo.status).toBe(201);

    const sesion = await login('temporal');
    await request(app).delete(`/usuarios/${nuevo.body.id}`).set(conToken(admin.token)).expect(204);

    const refresco = await request(app).post('/auth/refrescar').set('Cookie', sesion.cookie);
    expect(refresco.status).toBe(401);

    const otraVez = await request(app).post('/auth/login').send({ usuario: 'temporal', password: PASSWORD });
    expect(otraVez.status).toBe(401);
  });
});
