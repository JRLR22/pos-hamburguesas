import { useState, useEffect } from 'react';
import { useSesion } from '../context/useSesion';
import { api } from '../lib/api';
import { useRecurso } from '../lib/useRecurso';
import { formatoMoneda, pesosACentavos, centavosAPesos } from '../lib/dinero';
import { CATEGORIAS_PRODUCTO, ROLES } from '../lib/constantes';

export default function Admin() {
  const [tab, setTab] = useState('productos');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-lg font-semibold text-ink mb-4">Administrar catálogo</h1>

      <nav className="flex gap-1 border-b border-border mb-6">
        <button
          onClick={() => setTab('productos')}
          className={`px-3 py-2 text-sm font-medium border-b-2 ${
            tab === 'productos' ? 'text-rust border-rust' : 'text-ink-muted border-transparent'
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setTab('extras')}
          className={`px-3 py-2 text-sm font-medium border-b-2 ${
            tab === 'extras' ? 'text-rust border-rust' : 'text-ink-muted border-transparent'
          }`}
        >
          Extras
        </button>
        <button
          onClick={() => setTab('usuarios')}
          className={`px-3 py-2 text-sm font-medium border-b-2 ${
            tab === 'usuarios' ? 'text-rust border-rust' : 'text-ink-muted border-transparent'
          }`}
        >
          Usuarios
        </button>
      </nav>

      {tab === 'productos' && <PanelProductos />}
      {tab === 'extras' && <PanelExtras />}
      {tab === 'usuarios' && <PanelUsuarios />}
    </div>
  );
}

/* ---------------------------- PRODUCTOS ---------------------------- */

function PanelProductos() {
  const { datos: productos = [], error: errorCarga, recargar: cargar } = useRecurso(api.listarProductos);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState('');

  async function guardar(datos) {
    setError('');
    try {
      if (datos.id) {
        await api.editarProducto(datos.id, datos);
      } else {
        await api.crearProducto(datos);
      }
      setEditando(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function darDeBaja(id) {
    if (!confirm('¿Dar de baja este producto? Ya no aparecerá en el catálogo de venta.')) return;
    try {
      await api.desactivarProducto(id);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      {(error || errorCarga) && (
        <p role="alert" className="text-sm text-brick bg-brick/5 border border-brick/30 rounded-md px-3 py-2 mb-4">
          {error || errorCarga}
        </p>
      )}

      <button
        onClick={() => setEditando('nuevo')}
        className="mb-4 rounded-md bg-rust text-white text-sm font-medium px-4 py-2 hover:bg-rust-dark transition-colors"
      >
        Agregar producto
      </button>

      <div className="border border-border rounded-md divide-y divide-border bg-surface">
        {productos.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{p.nombre}</p>
              <p className="text-xs text-ink-muted">{p.categoria}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="num text-sm text-ink">{formatoMoneda(p.precio)}</span>
              <button onClick={() => setEditando(p)} className="text-sm text-ink-muted hover:text-rust">
                Editar
              </button>
              <button onClick={() => darDeBaja(p.id)} className="text-sm text-ink-muted hover:text-brick">
                Baja
              </button>
            </div>
          </div>
        ))}
        {productos.length === 0 && <p className="text-ink-muted text-sm px-4 py-6 text-center">Sin productos aún.</p>}
      </div>

      {editando && (
        <FormularioProducto
          producto={editando === 'nuevo' ? null : editando}
          onCancelar={() => setEditando(null)}
          onGuardar={guardar}
        />
      )}
    </div>
  );
}

function FormularioProducto({ producto, onCancelar, onGuardar }) {
  const [nombre, setNombre] = useState(producto?.nombre || '');
  const [categoria, setCategoria] = useState(producto?.categoria || CATEGORIAS_PRODUCTO[0]);
  const [precio, setPrecio] = useState(producto ? centavosAPesos(producto.precio) : '');

  function alEnviar(e) {
    e.preventDefault();
    onGuardar({ id: producto?.id, nombre, categoria, precio: pesosACentavos(precio) });
  }

  return (
    <Modal onCerrar={onCancelar} titulo={producto ? 'Editar producto' : 'Nuevo producto'}>
      <form onSubmit={alEnviar} className="space-y-3">
        <CampoTexto label="Nombre" value={nombre} onChange={setNombre} autoFocus required />
        <div>
          <label className="block text-sm text-ink-muted mb-1">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-ink"
          >
            {CATEGORIAS_PRODUCTO.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <CampoTexto label="Precio" value={precio} onChange={setPrecio} type="number" step="0.01" min="0" required />
        <BotonesFormulario onCancelar={onCancelar} />
      </form>
    </Modal>
  );
}

/* ------------------------------ EXTRAS ------------------------------ */

function PanelExtras() {
  const { datos: extras = [], error: errorCarga, recargar: cargar } = useRecurso(api.listarExtras);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState('');

  async function guardar(datos) {
    setError('');
    try {
      if (datos.id) {
        await api.editarExtra(datos.id, datos);
      } else {
        await api.crearExtra(datos);
      }
      setEditando(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function darDeBaja(id) {
    if (!confirm('¿Dar de baja este extra?')) return;
    try {
      await api.desactivarExtra(id);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      {(error || errorCarga) && (
        <p role="alert" className="text-sm text-brick bg-brick/5 border border-brick/30 rounded-md px-3 py-2 mb-4">
          {error || errorCarga}
        </p>
      )}
      <p className="text-sm text-ink-muted mb-4">
        Los extras (salsas, agregados) solo aparecen al vender productos de las categorías que elijas para cada uno.
      </p>

      <button
        onClick={() => setEditando('nuevo')}
        className="mb-4 rounded-md bg-rust text-white text-sm font-medium px-4 py-2 hover:bg-rust-dark transition-colors"
      >
        Agregar extra
      </button>

      <div className="border border-border rounded-md divide-y divide-border bg-surface">
        {extras.map((ex) => (
          <div key={ex.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{ex.nombre}</p>
              <p className="text-xs text-ink-muted">{ex.categorias.join(', ')}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="num text-sm text-ink">{ex.precio > 0 ? formatoMoneda(ex.precio) : 'Gratis'}</span>
              <button onClick={() => setEditando(ex)} className="text-sm text-ink-muted hover:text-rust">
                Editar
              </button>
              <button onClick={() => darDeBaja(ex.id)} className="text-sm text-ink-muted hover:text-brick">
                Baja
              </button>
            </div>
          </div>
        ))}
        {extras.length === 0 && <p className="text-ink-muted text-sm px-4 py-6 text-center">Sin extras aún.</p>}
      </div>

      {editando && (
        <FormularioExtra
          extra={editando === 'nuevo' ? null : editando}
          onCancelar={() => setEditando(null)}
          onGuardar={guardar}
        />
      )}
    </div>
  );
}

function FormularioExtra({ extra, onCancelar, onGuardar }) {
  const [nombre, setNombre] = useState(extra?.nombre || '');
  const [precio, setPrecio] = useState(extra ? centavosAPesos(extra.precio) : 0);
  const [categorias, setCategorias] = useState(extra?.categorias || []);

  function alternarCategoria(cat) {
    setCategorias((actual) => (actual.includes(cat) ? actual.filter((c) => c !== cat) : [...actual, cat]));
  }

  function alEnviar(e) {
    e.preventDefault();
    onGuardar({ id: extra?.id, nombre, precio: pesosACentavos(precio), categorias });
  }

  return (
    <Modal onCerrar={onCancelar} titulo={extra ? 'Editar extra' : 'Nuevo extra'}>
      <form onSubmit={alEnviar} className="space-y-3">
        <CampoTexto label="Nombre" value={nombre} onChange={setNombre} autoFocus required />
        <CampoTexto
          label="Precio (0 = gratis)"
          value={precio}
          onChange={setPrecio}
          type="number"
          step="0.01"
          min="0"
          required
        />
        <div>
          <p className="block text-sm text-ink-muted mb-1">Aplica a estas categorías</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS_PRODUCTO.filter((c) => c !== 'bebida').map((cat) => (
              <label
                key={cat}
                className={`text-sm px-3 py-1.5 rounded-md border cursor-pointer select-none
                  ${
                    categorias.includes(cat)
                      ? 'bg-rust text-white border-rust'
                      : 'border-border text-ink-muted hover:border-rust'
                  }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={categorias.includes(cat)}
                  onChange={() => alternarCategoria(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
          <p className="text-xs text-ink-muted mt-1">Nunca se ofrece en bebidas.</p>
        </div>
        <BotonesFormulario onCancelar={onCancelar} disabled={categorias.length === 0} />
      </form>
    </Modal>
  );
}

/* ----------------------------- USUARIOS ----------------------------- */

function PanelUsuarios() {
  const { sesion } = useSesion();
  const { datos: usuarios = [], error: errorCarga, recargar: cargar } = useRecurso(api.listarUsuarios);
  const [editando, setEditando] = useState(null); // usuario, 'nuevo', o null
  const [cambiandoPassword, setCambiandoPassword] = useState(null); // usuario o null
  const [error, setError] = useState('');

  async function guardar(datos) {
    setError('');
    try {
      if (datos.id) {
        await api.editarUsuario(datos.id, { nombre: datos.nombre, rol: datos.rol });
      } else {
        await api.crearUsuario(datos);
      }
      setEditando(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarPassword(id, password) {
    setError('');
    try {
      await api.cambiarPasswordUsuario(id, password);
      setCambiandoPassword(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function darDeBaja(usuario) {
    if (usuario.id === sesion.usuario.id) {
      setError('No puedes dar de baja tu propia cuenta.');
      return;
    }
    if (!confirm(`¿Dar de baja a "${usuario.nombre}"? Ya no podrá iniciar sesión.`)) return;
    setError('');
    try {
      await api.desactivarUsuario(usuario.id);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reactivar(usuario) {
    setError('');
    try {
      await api.reactivarUsuario(usuario.id);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      {(error || errorCarga) && (
        <p role="alert" className="text-sm text-brick bg-brick/5 border border-brick/30 rounded-md px-3 py-2 mb-4">
          {error || errorCarga}
        </p>
      )}
      <p className="text-sm text-ink-muted mb-4">
        Crea una cuenta por cada cajero o persona de cocina. Cada quien debe entrar con su propio usuario: así el
        reporte de ventas y la auditoría reflejan quién hizo qué.
      </p>

      <button
        onClick={() => setEditando('nuevo')}
        className="mb-4 rounded-md bg-rust text-white text-sm font-medium px-4 py-2 hover:bg-rust-dark transition-colors"
      >
        Agregar usuario
      </button>

      <div className="border border-border rounded-md divide-y divide-border bg-surface">
        {usuarios.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink flex items-center gap-2">
                {u.nombre}
                {u.id === sesion.usuario.id && <span className="text-xs text-ink-muted font-normal">(tú)</span>}
                {!u.activo && <span className="text-xs text-brick font-normal">Dado de baja</span>}
              </p>
              <p className="text-xs text-ink-muted">
                @{u.usuario} · {u.rol}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {u.activo ? (
                <>
                  <button onClick={() => setEditando(u)} className="text-sm text-ink-muted hover:text-rust">
                    Editar
                  </button>
                  <button onClick={() => setCambiandoPassword(u)} className="text-sm text-ink-muted hover:text-rust">
                    Contraseña
                  </button>
                  <button onClick={() => darDeBaja(u)} className="text-sm text-ink-muted hover:text-brick">
                    Baja
                  </button>
                </>
              ) : (
                <button onClick={() => reactivar(u)} className="text-sm text-olive hover:underline">
                  Reactivar
                </button>
              )}
            </div>
          </div>
        ))}
        {usuarios.length === 0 && <p className="text-ink-muted text-sm px-4 py-6 text-center">Sin usuarios aún.</p>}
      </div>

      {editando && (
        <FormularioUsuario
          usuario={editando === 'nuevo' ? null : editando}
          onCancelar={() => setEditando(null)}
          onGuardar={guardar}
        />
      )}

      {cambiandoPassword && (
        <FormularioPassword
          usuario={cambiandoPassword}
          onCancelar={() => setCambiandoPassword(null)}
          onGuardar={(password) => guardarPassword(cambiandoPassword.id, password)}
        />
      )}
    </div>
  );
}

function FormularioUsuario({ usuario, onCancelar, onGuardar }) {
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [nombreUsuario, setNombreUsuario] = useState(usuario?.usuario || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(usuario?.rol || 'cajero');

  function alEnviar(e) {
    e.preventDefault();
    if (usuario) {
      onGuardar({ id: usuario.id, nombre, rol });
    } else {
      onGuardar({ nombre, usuario: nombreUsuario, password, rol });
    }
  }

  return (
    <Modal onCerrar={onCancelar} titulo={usuario ? 'Editar usuario' : 'Nuevo usuario'}>
      <form onSubmit={alEnviar} className="space-y-3">
        <CampoTexto label="Nombre completo" value={nombre} onChange={setNombre} autoFocus required />

        {!usuario && (
          <>
            <CampoTexto
              label="Nombre de usuario (para entrar)"
              value={nombreUsuario}
              onChange={setNombreUsuario}
              required
              autoComplete="off"
            />
            <CampoTexto
              label="Contraseña temporal"
              value={password}
              onChange={setPassword}
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
            <p className="text-xs text-ink-muted -mt-2">
              Mínimo 8 caracteres. Puedes restablecerla después con el botón "Contraseña".
            </p>
          </>
        )}

        <div>
          <label className="block text-sm text-ink-muted mb-1">Rol</label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-ink"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <BotonesFormulario onCancelar={onCancelar} />
      </form>
    </Modal>
  );
}

function FormularioPassword({ usuario, onCancelar, onGuardar }) {
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');

  function alEnviar(e) {
    e.preventDefault();
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden');
      return;
    }
    onGuardar(password);
  }

  return (
    <Modal onCerrar={onCancelar} titulo={`Nueva contraseña para ${usuario.nombre}`}>
      <form onSubmit={alEnviar} className="space-y-3">
        {error && (
          <p role="alert" className="text-sm text-brick bg-brick/5 border border-brick/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <CampoTexto
          label="Contraseña nueva"
          value={password}
          onChange={setPassword}
          type="password"
          minLength={8}
          required
          autoFocus
          autoComplete="new-password"
        />
        <CampoTexto
          label="Confirmar contraseña"
          value={confirmacion}
          onChange={setConfirmacion}
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <BotonesFormulario onCancelar={onCancelar} />
      </form>
    </Modal>
  );
}

/* ----------------------------- COMPARTIDOS ----------------------------- */

function Modal({ titulo, children, onCerrar }) {
  // Cerrar con Escape
  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div role="dialog" aria-modal="true" aria-label={titulo} className="bg-surface rounded-md max-w-sm w-full p-5">
        <h3 className="font-semibold text-ink mb-4">{titulo}</h3>
        {children}
      </div>
    </div>
  );
}

function CampoTexto({ label, value, onChange, ...props }) {
  return (
    <div>
      <label className="block text-sm text-ink-muted mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border px-3 py-2 text-ink focus:border-rust focus:ring-1 focus:ring-rust outline-none"
        {...props}
      />
    </div>
  );
}

function BotonesFormulario({ onCancelar, disabled }) {
  return (
    <div className="flex gap-2 pt-2">
      <button
        type="button"
        onClick={onCancelar}
        className="flex-1 rounded-md border border-border text-ink font-medium py-2.5 hover:bg-surface-alt transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={disabled}
        className="flex-1 rounded-md bg-rust text-white font-medium py-2.5 hover:bg-rust-dark transition-colors disabled:opacity-40"
      >
        Guardar
      </button>
    </div>
  );
}
