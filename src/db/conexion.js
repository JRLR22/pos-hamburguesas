const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// DB_PATH=':memory:' se usa en los tests para no tocar la base real.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'pos.db');
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'db', 'schema.sql');

if (DB_PATH !== ':memory:') fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

function agregarColumnaSiFalta(tabla, columna, definicion) {
  const columnas = db.prepare(`PRAGMA table_info(${tabla})`).all();
  if (!columnas.some((c) => c.name === columna)) {
    db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
  }
}

agregarColumnaSiFalta('pedidos', 'metodo_pago', `TEXT NOT NULL DEFAULT 'efectivo'`);
agregarColumnaSiFalta('extras', 'categorias', `TEXT NOT NULL DEFAULT 'hamburguesa,hotdog,boneless'`);
agregarColumnaSiFalta(
  'pedidos',
  'estado_cocina',
  `TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_cocina IN ('pendiente', 'listo'))`
);

const usuariosActual = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'usuarios'`).get();
if (usuariosActual && !usuariosActual.sql.includes("'cocina'")) {
  db.pragma('foreign_keys = OFF');
  db.exec(`
    CREATE TABLE usuarios_nueva (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        usuario TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        rol TEXT NOT NULL CHECK (rol IN ('admin', 'cajero', 'cocina')),
        activo INTEGER NOT NULL DEFAULT 1,
        creado_en TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO usuarios_nueva (id, nombre, usuario, password_hash, rol, activo, creado_en)
    SELECT id, nombre, usuario, password_hash, rol, activo, creado_en FROM usuarios;
    DROP TABLE usuarios;
    ALTER TABLE usuarios_nueva RENAME TO usuarios;
  `);
  db.pragma('foreign_keys = ON');
}

module.exports = db;
