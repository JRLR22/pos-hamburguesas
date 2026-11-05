-- ============================================
-- ESQUEMA DE BASE DE DATOS - POS Hamburguesas/Hotdogs/Boneless
-- Motor: SQLite
-- Dinero: SIEMPRE en centavos (INTEGER). $85.00 = 8500.
--         Se divide entre 100 solo al mostrar (ver src/services/dinero.js
--         en backend y frontend/src/lib/dinero.js en frontend).
-- ============================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------
-- USUARIOS (admin / cajero / cocina)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    usuario TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'cajero', 'cocina')),
    activo INTEGER NOT NULL DEFAULT 1,
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------
-- PRODUCTOS (catálogo)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('hamburguesa', 'hotdog', 'boneless', 'bebida', 'extra', 'otro')),
    precio INTEGER NOT NULL CHECK (precio >= 0),  -- centavos
    activo INTEGER NOT NULL DEFAULT 1,
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------
-- PEDIDOS (ventas)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL DEFAULT (datetime('now')),
    total INTEGER NOT NULL CHECK (total >= 0),  -- centavos
    origen TEXT NOT NULL DEFAULT 'local' CHECK (origen IN ('local', 'didi', 'uber_eats', 'rappi')),
    estado TEXT NOT NULL DEFAULT 'completado' CHECK (estado IN ('completado', 'cancelado')),
    estado_cocina TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_cocina IN ('pendiente', 'listo')),
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    cajero_id INTEGER NOT NULL,
    FOREIGN KEY (cajero_id) REFERENCES usuarios(id)
);

-- ----------------------------------------
-- ITEMS DE CADA PEDIDO (detalle)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS pedido_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario INTEGER NOT NULL CHECK (precio_unitario >= 0),  -- centavos
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0),  -- centavos
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- ----------------------------------------
-- EXTRAS (salsas, agregados)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS extras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio INTEGER NOT NULL DEFAULT 0 CHECK (precio >= 0),  -- centavos, 0 = gratis
    categorias TEXT NOT NULL DEFAULT '',
    activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pedido_item_extras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_item_id INTEGER NOT NULL,
    extra_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    precio INTEGER NOT NULL CHECK (precio >= 0),  -- centavos
    FOREIGN KEY (pedido_item_id) REFERENCES pedido_items(id) ON DELETE CASCADE,
    FOREIGN KEY (extra_id) REFERENCES extras(id)
);

-- ----------------------------------------
-- AUDITORÍA
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    accion TEXT NOT NULL,
    detalle TEXT,
    fecha TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ----------------------------------------
-- SESIONES (refresh tokens; solo se guarda el hash SHA-256)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    expira_en TEXT NOT NULL,
    revocado INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ----------------------------------------
-- ÍNDICES
-- ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha);
CREATE INDEX IF NOT EXISTS idx_pedidos_cajero ON pedidos(cajero_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);
