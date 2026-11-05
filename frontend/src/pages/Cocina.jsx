import { useState } from 'react';
import { useSesion } from '../context/useSesion';
import { api } from '../lib/api';
import { useRecurso } from '../lib/useRecurso';
import BotonTema from '../components/BotonTema';
import { horaLocal } from '../lib/fechas';
import { etiquetaOrigen } from '../lib/constantes';

const INTERVALO_MS = 5000;

export default function Cocina() {
  const { sesion, cerrarSesion } = useSesion();
  // Polling cada 5 s: si falla una consulta se conservan las comandas en pantalla
  const comandas = useRecurso(api.listarCocina, { intervalo: INTERVALO_MS });
  const pedidos = comandas.datos ?? [];
  const cargando = comandas.cargando;
  const [errorAccion, setErrorAccion] = useState('');
  const [marcando, setMarcando] = useState(null); // id del pedido en proceso
  const error = errorAccion || (comandas.datos === undefined ? comandas.error : '');

  async function alternarEstado(pedido) {
    setMarcando(pedido.id);
    setErrorAccion('');
    try {
      await api.marcarComanda(pedido.id, pedido.estado_cocina === 'listo' ? 'pendiente' : 'listo');
      comandas.recargar();
    } catch (err) {
      setErrorAccion(err.message);
    } finally {
      setMarcando(null);
    }
  }

  return (
    <div className="h-dvh flex flex-col bg-surface-alt">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 shrink-0">
        <h1 className="text-base font-semibold text-ink">Comandas — Cocina</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-ink-muted">{sesion.usuario.nombre}</span>
          <BotonTema />
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

      <div className="flex-1 overflow-y-auto p-4">
        {cargando ? (
          <p className="text-ink-muted text-sm">Cargando comandas...</p>
        ) : pedidos.length === 0 ? (
          <p className="text-ink-muted text-sm text-center mt-12">Sin comandas recientes.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className={`bg-surface border rounded-md p-4 flex flex-col transition-opacity ${
                  pedido.estado_cocina === 'listo' ? 'border-border opacity-60' : 'border-rust/40'
                }`}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="num font-semibold text-ink">#{pedido.id}</span>
                  <span className="num text-xs text-ink-muted">{horaLocal(pedido.fecha)}</span>
                </div>
                {pedido.origen !== 'local' && (
                  <p className="text-xs text-rust font-medium mb-2 uppercase">{etiquetaOrigen(pedido.origen)}</p>
                )}
                <ul className="space-y-1.5">
                  {pedido.items.map((it) => (
                    <li key={it.id} className="text-sm">
                      <span className="text-ink font-medium">{it.cantidad} x </span>
                      <span className="text-ink">{it.producto_nombre}</span>
                      {it.extras.length > 0 && (
                        <p className="text-xs text-ink-muted pl-4">+ {it.extras.map((ex) => ex.nombre).join(', ')}</p>
                      )}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => alternarEstado(pedido)}
                  disabled={marcando === pedido.id}
                  className={`mt-4 rounded-md text-sm font-medium py-2 transition-colors disabled:opacity-40 ${
                    pedido.estado_cocina === 'listo'
                      ? 'border border-border text-ink-muted hover:text-ink'
                      : 'bg-rust text-white hover:bg-rust-dark'
                  }`}
                >
                  {pedido.estado_cocina === 'listo' ? 'Regresar a pendiente' : 'Marcar como listo'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
