import { useState } from 'react';
import { SesionProvider } from './context/SesionContext';
import { useSesion } from './context/useSesion';
import Login from './pages/Login';
import Pos from './pages/Pos';
import Reportes from './pages/Reportes';
import Admin from './pages/Admin';
import Cocina from './pages/Cocina';
import { TemaProvider } from './context/TemaContext';
import BotonTema from './components/BotonTema';

function ContenidoApp() {
  const { sesion } = useSesion();
  const [vista, setVista] = useState('pos');

  if (!sesion) return <Login />;
  if (sesion.usuario.rol === 'cocina') return <Cocina />;

  const esAdmin = sesion.usuario.rol === 'admin';

  return (
    <div className={vista === 'pos' ? 'h-dvh flex flex-col' : ''}>
      {esAdmin && (
        <nav className="flex items-center justify-between px-4 pt-2 bg-surface border-b border-border text-sm shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setVista('pos')}
              className={`px-3 py-2 font-medium border-b-2 ${
                vista === 'pos' ? 'text-rust border-rust' : 'text-ink-muted border-transparent'
              }`}
            >
              Ventas
            </button>
            <button
              onClick={() => setVista('catalogo')}
              className={`px-3 py-2 font-medium border-b-2 ${
                vista === 'catalogo' ? 'text-rust border-rust' : 'text-ink-muted border-transparent'
              }`}
            >
              Catálogo
            </button>
            <button
              onClick={() => setVista('reportes')}
              className={`px-3 py-2 font-medium border-b-2 ${
                vista === 'reportes' ? 'text-rust border-rust' : 'text-ink-muted border-transparent'
              }`}
            >
              Reportes
            </button>
          </div>
          <BotonTema />
        </nav>
      )}
      <div className={vista === 'pos' ? 'flex-1 min-h-0' : 'overflow-y-auto'}>
        {vista === 'catalogo' && esAdmin && <Admin />}
        {vista === 'reportes' && esAdmin && <Reportes />}
        {(vista === 'pos' || !esAdmin) && <Pos />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TemaProvider>
      <SesionProvider>
        <ContenidoApp />
      </SesionProvider>
    </TemaProvider>
  );
}
