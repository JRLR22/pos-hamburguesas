import { useState } from 'react';
import { useSesion } from '../context/useSesion';
import BotonTema from '../components/BotonTema';

export default function Login() {
  const { iniciarSesion } = useSesion();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await iniciarSesion(usuario.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-alt px-4">
      <div className="fixed top-2 right-2 z-50">
        <BotonTema />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-ink">Sistema de pedidos</h1>
          <p className="text-sm text-ink-muted mt-1">Inicia sesión con tu usuario de caja</p>
        </div>

        <form onSubmit={manejarEnvio} className="bg-surface border border-border rounded-md p-6 space-y-4">
          <div>
            <label htmlFor="usuario" className="block text-sm font-medium text-ink mb-1">
              Usuario
            </label>
            <input
              id="usuario"
              type="text"
              autoComplete="username"
              autoFocus
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2.5 text-base
                         focus:border-rust focus:ring-1 focus:ring-rust outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2.5 text-base
                         focus:border-rust focus:ring-1 focus:ring-rust outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-brick border border-brick/30 bg-brick/5 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-md bg-rust text-white font-medium py-2.5
                       hover:bg-rust-dark transition-colors disabled:opacity-60"
          >
            {cargando ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
