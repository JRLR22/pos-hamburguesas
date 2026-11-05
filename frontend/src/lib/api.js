const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Si el servidor no responde (PC apagada, IP equivocada), fallar en vez de quedarse cargando para siempre
const TIEMPO_LIMITE_MS = 10000;

export const SESION_EXPIRADA = 'pos:sesion-expirada';

let tokenEnMemoria = null;
let promesaRefresco = null;

export function fijarToken(token) {
  tokenEnMemoria = token;
}

async function refrescar() {
  const respuesta = await fetch(`${BASE_URL}/auth/refrescar`, {
    method: 'POST',
    credentials: 'include',
    signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
  });
  if (!respuesta.ok) return null;
  const datos = await respuesta.json();
  tokenEnMemoria = datos.token;
  return datos;
}

/**
 * Un solo refresco a la vez: si varias peticiones reciben 401 al mismo tiempo
 * (p. ej. un Promise.all), todas esperan la MISMA renovación. Si cada una
 * refrescara por su cuenta, la primera rotaría el token y las demás fallarían,
 * cerrando la sesión del cajero sin motivo.
 */
export function restaurarSesion() {
  if (!promesaRefresco) {
    promesaRefresco = refrescar()
      .catch(() => null)
      .finally(() => (promesaRefresco = null));
  }
  return promesaRefresco;
}

async function solicitud(ruta, { metodo = 'GET', cuerpo, reintentado = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (tokenEnMemoria) headers.Authorization = `Bearer ${tokenEnMemoria}`;

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers,
      credentials: 'include',
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  if (respuesta.status === 401 && !reintentado && ruta !== '/auth/login' && ruta !== '/auth/refrescar') {
    const renovado = await restaurarSesion();
    if (renovado) return solicitud(ruta, { metodo, cuerpo, reintentado: true });
    window.dispatchEvent(new CustomEvent(SESION_EXPIRADA));
    throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
  }

  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || 'Ocurrió un error inesperado');
  return datos;
}

export const api = {
  login: async (usuario, password) => {
    const datos = await solicitud('/auth/login', { metodo: 'POST', cuerpo: { usuario, password } });
    tokenEnMemoria = datos.token;
    return datos;
  },
  logout: async () => {
    await solicitud('/auth/logout', { metodo: 'POST' }).catch(() => {});
    tokenEnMemoria = null;
  },
  listarProductos: () => solicitud('/productos'),
  crearProducto: (datos) => solicitud('/productos', { metodo: 'POST', cuerpo: datos }),
  editarProducto: (id, datos) => solicitud(`/productos/${id}`, { metodo: 'PUT', cuerpo: datos }),
  desactivarProducto: (id) => solicitud(`/productos/${id}`, { metodo: 'DELETE' }),
  listarExtras: () => solicitud('/extras'),
  crearExtra: (datos) => solicitud('/extras', { metodo: 'POST', cuerpo: datos }),
  editarExtra: (id, datos) => solicitud(`/extras/${id}`, { metodo: 'PUT', cuerpo: datos }),
  desactivarExtra: (id) => solicitud(`/extras/${id}`, { metodo: 'DELETE' }),
  crearPedido: ({ items, metodo_pago, origen }) =>
    solicitud('/pedidos', { metodo: 'POST', cuerpo: { items, metodo_pago, origen } }),
  reimprimirPedido: (id) => solicitud(`/pedidos/${id}/reimprimir`, { metodo: 'POST' }),
  historialDelDia: (fecha) => solicitud(`/pedidos?fecha=${fecha}`),
  totalDelDia: (fecha) => solicitud(`/ventas/dia?fecha=${fecha}`),
  totalPorCajero: (fecha) => solicitud(`/ventas/por-cajero?fecha=${fecha}`),
  corteDelDia: (fecha) => solicitud(`/ventas/corte?fecha=${fecha}`),
  listarCocina: () => solicitud('/cocina'),
  marcarComanda: (id, estado) => solicitud(`/cocina/${id}`, { metodo: 'PATCH', cuerpo: { estado } }),
  listarUsuarios: () => solicitud('/usuarios'),
  crearUsuario: (datos) => solicitud('/usuarios', { metodo: 'POST', cuerpo: datos }),
  editarUsuario: (id, datos) => solicitud(`/usuarios/${id}`, { metodo: 'PUT', cuerpo: datos }),
  cambiarPasswordUsuario: (id, password) =>
    solicitud(`/usuarios/${id}/password`, { metodo: 'PUT', cuerpo: { password } }),
  desactivarUsuario: (id) => solicitud(`/usuarios/${id}`, { metodo: 'DELETE' }),
  reactivarUsuario: (id) => solicitud(`/usuarios/${id}/reactivar`, { metodo: 'POST' }),
  cancelarPedido: (id, motivo) =>
    solicitud(`/pedidos/${id}`, { metodo: 'DELETE', cuerpo: motivo ? { motivo } : undefined }),
};
