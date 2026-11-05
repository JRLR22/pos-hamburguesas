const { z } = require('zod');

// --- Piezas reutilizables --------------------------------------------------

// Precio SIEMPRE en centavos enteros (regla del proyecto, ver db/schema.sql)
const centavos = z.number().int('Debe ser un entero en centavos').min(0);

const { CATEGORIAS_PRODUCTO, METODOS_PAGO, ORIGENES_PEDIDO, ROLES, ESTADOS_COCINA } = require('../constantes');

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)');

// --- Auth -------------------------------------------------------------------

const login = z.object({
  usuario: z.string().min(1, 'Es obligatorio'),
  password: z.string().min(1, 'Es obligatoria'),
});

// --- Productos ---------------------------------------------------------------

const crearProducto = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  categoria: z.enum(CATEGORIAS_PRODUCTO, { message: 'Categoría inválida' }),
  precio: centavos,
});

const editarProducto = crearProducto;

// --- Extras -------------------------------------------------------------------

const crearExtra = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  precio: centavos.default(0),
  categorias: z.array(z.enum(CATEGORIAS_PRODUCTO)).min(1, 'Elige al menos una categoría'),
});

const editarExtra = crearExtra;

// --- Pedidos -------------------------------------------------------------------

const itemPedido = z.object({
  producto_id: z.number().int().positive(),
  cantidad: z.number().int().positive().max(999),
  extra_ids: z.array(z.number().int().positive()).default([]),
});

const crearPedido = z.object({
  items: z.array(itemPedido).min(1, 'El pedido debe tener al menos un producto').max(100),
  origen: z.enum(ORIGENES_PEDIDO).default('local'),
  metodo_pago: z.enum(METODOS_PAGO).default('efectivo'),
});

const cancelarPedido = z.object({
  motivo: z.string().trim().max(300).optional(),
});

// --- Usuarios -------------------------------------------------------------------

const crearUsuario = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  usuario: z
    .string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(40)
    .regex(/^[a-z0-9._-]+$/i, 'Solo letras, números, puntos, guiones'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  rol: z.enum(ROLES, { message: 'Rol inválido' }),
});

const editarUsuario = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  rol: z.enum(ROLES, { message: 'Rol inválido' }),
});

const cambiarPassword = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

// --- Cocina -------------------------------------------------------------------

const estadoCocina = z.object({
  estado: z.enum(ESTADOS_COCINA, { message: 'Estado inválido' }),
});

// --- Reportes (query string) ----------------------------------------------------

const consultaFecha = z.object({ fecha: fecha.optional() });

const rangoFechas = z
  .object({ desde: fecha, hasta: fecha })
  .refine((r) => r.desde <= r.hasta, { message: 'desde no puede ser posterior a hasta', path: ['desde'] });

module.exports = {
  consultaFecha,
  rangoFechas,
  login,
  crearProducto,
  editarProducto,
  crearExtra,
  editarExtra,
  crearPedido,
  cancelarPedido,
  crearUsuario,
  editarUsuario,
  cambiarPassword,
  estadoCocina,
};
