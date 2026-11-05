import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useRecurso } from '../lib/useRecurso';
import { formatoMoneda } from '../lib/dinero';
import { hoyLocal, horaLocal } from '../lib/fechas';
import { etiquetaOrigen, etiquetaPago } from '../lib/constantes';

export default function Reportes() {
  const [fecha, setFecha] = useState(hoyLocal);
  const [errorAccion, setError] = useState('');
  const [pedidoACancelar, setPedidoACancelar] = useState(null); // pedido o null

  // Cambia cuando cambia la fecha, y useRecurso vuelve a cargar
  const cargarReporte = useCallback(
    () => Promise.all([api.totalDelDia(fecha), api.totalPorCajero(fecha), api.historialDelDia(fecha)]),
    [fecha]
  );
  const reporte = useRecurso(cargarReporte);
  const [totalDia, porCajero, pedidosDia] = reporte.datos ?? [null, [], []];
  const error = errorAccion || reporte.error;
  const cargando = reporte.cargando;

  async function confirmarCancelacion(motivo) {
    if (!pedidoACancelar) return;
    setError('');
    try {
      await api.cancelarPedido(pedidoACancelar.id, motivo);
      setPedidoACancelar(null);
      reporte.recargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-ink">Reporte de ventas</h1>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          Fecha
          <input
            type="date"
            value={fecha}
            onChange={(e) => e.target.value && setFecha(e.target.value)}
            className="border border-border rounded-md px-2 py-1.5 text-ink"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-brick border border-brick/30 bg-brick/5 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-ink-muted text-sm">Cargando...</p>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-border rounded-md p-4 bg-surface">
              <p className="text-xs text-ink-muted mb-1">Total vendido</p>
              <p className="num text-2xl font-semibold text-ink">{formatoMoneda(totalDia?.total ?? 0)}</p>
            </div>
            <div className="border border-border rounded-md p-4 bg-surface">
              <p className="text-xs text-ink-muted mb-1">Pedidos</p>
              <p className="num text-2xl font-semibold text-ink">{totalDia?.pedidos ?? 0}</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-ink mb-2">Desglose por cajero</h2>
            <div className="border border-border rounded-md overflow-hidden bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-ink-muted">
                    <th className="px-4 py-2 font-medium">Cajero</th>
                    <th className="px-4 py-2 font-medium text-right">Pedidos</th>
                    <th className="px-4 py-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {porCajero.map((c) => (
                    <tr key={c.cajero_id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-ink">{c.cajero_nombre}</td>
                      <td className="num px-4 py-2 text-right text-ink">{c.pedidos}</td>
                      <td className="num px-4 py-2 text-right text-ink">{formatoMoneda(c.total)}</td>
                    </tr>
                  ))}
                  {porCajero.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-ink-muted">
                        Sin ventas registradas en esta fecha.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-ink mb-2">Pedidos del día</h2>
            <div className="border border-border rounded-md divide-y divide-border bg-surface">
              {pedidosDia.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink flex items-center gap-2">
                      <span className="num">#{p.id}</span>
                      <span className="num text-ink-muted font-normal">{horaLocal(p.fecha)}</span>
                      {p.origen !== 'local' && (
                        <span className="text-xs text-rust font-medium uppercase">{etiquetaOrigen(p.origen)}</span>
                      )}
                      {p.estado === 'cancelado' && <span className="text-xs text-brick font-normal">Cancelado</span>}
                    </p>
                    <p className="text-xs text-ink-muted">{etiquetaPago(p.metodo_pago)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`num text-sm ${p.estado === 'cancelado' ? 'text-ink-muted line-through' : 'text-ink'}`}
                    >
                      {formatoMoneda(p.total)}
                    </span>
                    {p.estado === 'completado' && (
                      <button onClick={() => setPedidoACancelar(p)} className="text-sm text-ink-muted hover:text-brick">
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {pedidosDia.length === 0 && (
                <p className="text-ink-muted text-sm px-4 py-6 text-center">Sin pedidos en esta fecha.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {pedidoACancelar && (
        <ModalCancelar
          pedido={pedidoACancelar}
          onCerrar={() => setPedidoACancelar(null)}
          onConfirmar={confirmarCancelacion}
        />
      )}
    </div>
  );
}

function ModalCancelar({ pedido, onCerrar, onConfirmar }) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await onConfirmar(motivo.trim() || undefined);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-md max-w-sm w-full p-5">
        <h3 className="font-semibold text-ink mb-1">Cancelar pedido #{pedido.id}</h3>
        <p className="text-sm text-ink-muted mb-4">
          Total {formatoMoneda(pedido.total)} · {etiquetaPago(pedido.metodo_pago)}. Esta acción no se puede deshacer.
        </p>

        <form onSubmit={alEnviar} className="space-y-3">
          <div>
            <label className="block text-sm text-ink-muted mb-1">Motivo (opcional, queda en auditoría)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Ej. cliente se arrepintió, error al capturar, producto agotado..."
              className="w-full rounded-md border border-border px-3 py-2 text-ink focus:border-rust focus:ring-1 focus:ring-rust outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-md border border-border text-ink font-medium py-2.5 hover:bg-surface-alt transition-colors"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 rounded-md bg-brick text-white font-medium py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {enviando ? 'Cancelando...' : 'Confirmar cancelación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
