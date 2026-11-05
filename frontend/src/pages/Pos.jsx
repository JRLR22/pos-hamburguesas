import { useState, useMemo } from 'react';
import { useSesion } from '../context/useSesion';
import { api } from '../lib/api';
import { useRecurso } from '../lib/useRecurso';
import BotonTema from '../components/BotonTema';
import { formatoMoneda } from '../lib/dinero';
import { CATEGORIAS_PRODUCTO, METODOS_PAGO, ORIGENES_PEDIDO } from '../lib/constantes';

let contadorLinea = 0;
const nuevoIdLinea = () => `linea-${Date.now()}-${contadorLinea++}`;

const SIN_CATALOGO = [[], []];
const cargarCatalogo = () => Promise.all([api.listarProductos(), api.listarExtras()]);

export default function Pos() {
  const { sesion, cerrarSesion } = useSesion();
  const catalogo = useRecurso(cargarCatalogo);
  const [productos, extrasDisponibles] = catalogo.datos ?? SIN_CATALOGO;
  const [categoriaElegida, setCategoriaActiva] = useState(null);
  const [carrito, setCarrito] = useState([]); // [{ id, producto, cantidad, extras: [] }]
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [origen, setOrigen] = useState('local');
  const [errorCobro, setError] = useState('');
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [productoParaExtras, setProductoParaExtras] = useState(null);

  const cargando = catalogo.cargando;
  const error = errorCobro || catalogo.error;

  const categorias = useMemo(
    () =>
      [...new Set(productos.map((p) => p.categoria))].sort(
        (a, b) => CATEGORIAS_PRODUCTO.indexOf(a) - CATEGORIAS_PRODUCTO.indexOf(b)
      ),
    [productos]
  );

  // Si el cajero no ha elegido pestaña, se muestra la primera categoría disponible
  const categoriaActiva = categoriaElegida ?? categorias[0] ?? null;

  const productosVisibles = useMemo(
    () => productos.filter((p) => p.categoria === categoriaActiva),
    [productos, categoriaActiva]
  );

  const total = useMemo(
    () =>
      carrito.reduce((acc, it) => {
        const precioExtras = it.extras.reduce((a, ex) => a + ex.precio, 0);
        return acc + (it.producto.precio + precioExtras) * it.cantidad;
      }, 0),
    [carrito]
  );

  function alSeleccionarProducto(producto) {
    const extrasAplicables = extrasDisponibles.filter((ex) => ex.categorias.includes(producto.categoria));
    // Si no hay extras para esta categoría (ej. bebidas), agregar directo
    if (extrasAplicables.length === 0) {
      agregarLinea(producto, [], 1);
      return;
    }
    setProductoParaExtras(producto);
  }

  function agregarLinea(producto, extras, cantidad) {
    setCarrito((actual) => [...actual, { id: nuevoIdLinea(), producto, cantidad, extras }]);
  }

  function cambiarCantidad(lineaId, delta) {
    setCarrito((actual) =>
      actual
        .map((it) => (it.id === lineaId ? { ...it, cantidad: it.cantidad + delta } : it))
        .filter((it) => it.cantidad > 0)
    );
  }

  async function cobrar() {
    if (carrito.length === 0) return;
    setEnviando(true);
    setError('');
    try {
      const items = carrito.map((it) => ({
        producto_id: it.producto.id,
        cantidad: it.cantidad,
        extra_ids: it.extras.map((ex) => ex.id),
      }));
      const resultado = await api.crearPedido({ items, metodo_pago: metodoPago, origen });
      setUltimoPedido(resultado);
      setCarrito([]);
      setOrigen('local');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return <div className="h-dvh flex items-center justify-center text-ink-muted">Cargando catálogo...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-surface-alt overflow-hidden">
      {/* Barra superior */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 shrink-0">
        <h1 className="text-base font-semibold text-ink">Sistema de pedidos</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-ink-muted">{sesion.usuario.nombre}</span>
          {sesion.usuario.rol !== 'admin' && <BotonTema />}
          <button onClick={cerrarSesion} className="text-ink-muted hover:text-brick transition-colors">
            Salir
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="bg-brick/5 text-brick text-sm px-4 py-2 border-b border-brick/20 shrink-0">
          {error}
        </p>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Catálogo */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 md:min-h-full">
          <nav className="flex gap-1 px-4 pt-3 border-b border-border bg-surface overflow-x-auto shrink-0">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-3 py-2 text-sm font-medium rounded-t-md whitespace-nowrap transition-colors
                  ${
                    categoriaActiva === cat
                      ? 'text-rust border-b-2 border-rust'
                      : 'text-ink-muted hover:text-ink border-b-2 border-transparent'
                  }`}
              >
                {capitalizar(cat)}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {productosVisibles.map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => alSeleccionarProducto(producto)}
                  className="text-left bg-surface border border-border rounded-md p-4
                             hover:border-rust transition-colors active:scale-[0.98]"
                >
                  <p className="font-medium text-ink leading-tight">{producto.nombre}</p>
                  <p className="num text-sm text-ink-muted mt-2">{formatoMoneda(producto.precio)}</p>
                </button>
              ))}
              {productosVisibles.length === 0 && (
                <p className="text-ink-muted text-sm col-span-full">No hay productos en esta categoría.</p>
              )}
            </div>
          </div>
        </div>

        {/* Pedido actual: altura fija en móvil con scroll interno; footer siempre visible */}
        <aside className="w-full md:w-80 h-[45vh] md:h-auto border-t md:border-t-0 md:border-l border-border bg-surface flex flex-col shrink-0 min-h-0">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <h2 className="font-semibold text-ink text-sm">Pedido actual</h2>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {carrito.length === 0 ? (
              <p className="text-ink-muted text-sm px-4 py-6 text-center">
                Selecciona productos del catálogo para iniciar el pedido.
              </p>
            ) : (
              <ul>
                {carrito.map((it) => (
                  <li key={it.id} className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{it.producto.nombre}</p>
                      {it.extras.length > 0 && (
                        <p className="text-xs text-ink-muted truncate">+ {it.extras.map((e) => e.nombre).join(', ')}</p>
                      )}
                      <p className="num text-xs text-ink-muted">
                        {formatoMoneda(it.producto.precio + it.extras.reduce((a, e) => a + e.precio, 0))} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        onClick={() => cambiarCantidad(it.id, -1)}
                        aria-label={`Quitar una unidad de ${it.producto.nombre}`}
                        className="w-7 h-7 flex items-center justify-center rounded border border-border text-ink hover:border-rust"
                      >
                        −
                      </button>
                      <span className="num text-sm w-5 text-center">{it.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(it.id, 1)}
                        aria-label={`Agregar una unidad de ${it.producto.nombre}`}
                        className="w-7 h-7 flex items-center justify-center rounded border border-border text-ink hover:border-rust"
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border px-4 py-4 space-y-3 shrink-0">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-muted">Total</span>
              <span className="num text-2xl font-semibold text-ink">{formatoMoneda(total)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm text-ink-muted">
                Origen
                <select
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border px-2 py-2 text-ink"
                >
                  {ORIGENES_PEDIDO.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-ink-muted">
                Forma de pago
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border px-2 py-2 text-ink"
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m.valor} value={m.valor}>
                      {m.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              onClick={cobrar}
              disabled={carrito.length === 0 || enviando}
              className="w-full rounded-md bg-rust text-white font-medium py-3
                         hover:bg-rust-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enviando ? 'Procesando...' : 'Cobrar'}
            </button>
          </div>
        </aside>
      </div>

      {productoParaExtras && (
        <ModalExtras
          producto={productoParaExtras}
          extrasDisponibles={extrasDisponibles.filter((ex) => ex.categorias.includes(productoParaExtras.categoria))}
          onCancelar={() => setProductoParaExtras(null)}
          onConfirmar={(extras, cantidad) => {
            agregarLinea(productoParaExtras, extras, cantidad);
            setProductoParaExtras(null);
          }}
        />
      )}

      {ultimoPedido && <ComandaModal pedido={ultimoPedido} onCerrar={() => setUltimoPedido(null)} />}
    </div>
  );
}

function ModalExtras({ producto, extrasDisponibles, onCancelar, onConfirmar }) {
  const [seleccionados, setSeleccionados] = useState([]);
  const [cantidad, setCantidad] = useState(1);

  function alternar(extra) {
    setSeleccionados((actual) =>
      actual.some((e) => e.id === extra.id) ? actual.filter((e) => e.id !== extra.id) : [...actual, extra]
    );
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-md max-w-sm w-full p-5">
        <h3 className="font-semibold text-ink mb-1">{producto.nombre}</h3>
        <p className="num text-sm text-ink-muted mb-4">{formatoMoneda(producto.precio)}</p>

        <p className="text-sm font-medium text-ink mb-2">Agregados (opcional)</p>
        <ul className="space-y-1 mb-4 max-h-48 overflow-y-auto">
          {extrasDisponibles.map((extra) => (
            <li key={extra.id}>
              <label className="flex items-center justify-between gap-2 text-sm py-1.5 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={seleccionados.some((e) => e.id === extra.id)}
                    onChange={() => alternar(extra)}
                    className="accent-rust"
                  />
                  {extra.nombre}
                </span>
                <span className="num text-ink-muted">
                  {extra.precio > 0 ? `+${formatoMoneda(extra.precio)}` : 'Gratis'}
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-ink-muted">Cantidad</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              className="w-7 h-7 flex items-center justify-center rounded border border-border hover:border-rust"
            >
              −
            </button>
            <span className="num text-sm w-5 text-center">{cantidad}</span>
            <button
              onClick={() => setCantidad((c) => c + 1)}
              className="w-7 h-7 flex items-center justify-center rounded border border-border hover:border-rust"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancelar}
            className="flex-1 rounded-md border border-border text-ink font-medium py-2.5 hover:bg-surface-alt transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(seleccionados, cantidad)}
            className="flex-1 rounded-md bg-rust text-white font-medium py-2.5 hover:bg-rust-dark transition-colors"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

function ComandaModal({ pedido, onCerrar }) {
  const [reimprimiendo, setReimprimiendo] = useState(false);
  const [errorReimpresion, setErrorReimpresion] = useState('');
  const [reimpresionOk, setReimpresionOk] = useState(false);

  async function reimprimir() {
    setReimprimiendo(true);
    setErrorReimpresion('');
    setReimpresionOk(false);
    try {
      await api.reimprimirPedido(pedido.pedido.id);
      setReimpresionOk(true);
    } catch (err) {
      setErrorReimpresion(err.message);
    } finally {
      setReimprimiendo(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-md max-w-sm w-full p-5">
        <h3 className="font-semibold text-ink mb-1">Pedido #{pedido.pedido.id} registrado</h3>
        <p className="text-sm text-ink-muted mb-4">Envía la comanda a cocina y entrega el ticket.</p>

        {!pedido.impresion.exito && !pedido.impresion.omitida && (
          <p role="alert" className="text-sm bg-brick/5 text-brick rounded-md px-3 py-2 mb-4">
            No se imprimió automáticamente: {pedido.impresion.error}. Usa "Reimprimir" cuando la impresora esté lista.
          </p>
        )}
        {errorReimpresion && (
          <p role="alert" className="text-sm bg-brick/5 text-brick rounded-md px-3 py-2 mb-4">
            No se pudo imprimir: {errorReimpresion}
          </p>
        )}
        {reimpresionOk && (
          <p className="text-sm bg-rust/5 text-rust rounded-md px-3 py-2 mb-4">Comanda enviada a la impresora.</p>
        )}

        <pre className="num text-xs bg-surface-alt border border-border rounded-md p-3 whitespace-pre-wrap mb-4">
          {pedido.comanda}
        </pre>

        <div className="flex gap-2">
          <button
            onClick={reimprimir}
            disabled={reimprimiendo}
            className="flex-1 rounded-md border border-border text-ink font-medium py-2.5
                       hover:bg-surface-alt transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {reimprimiendo ? 'Imprimiendo...' : 'Reimprimir'}
          </button>
          <button
            onClick={onCerrar}
            className="flex-1 rounded-md bg-rust text-white font-medium py-2.5 hover:bg-rust-dark transition-colors"
          >
            Nuevo pedido
          </button>
        </div>
      </div>
    </div>
  );
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
