import { useEffect, useState, useCallback } from 'react';
import { TemaContext } from './contextos';

const CLAVE_STORAGE = 'pos_tema'; // 'claro' | 'oscuro' — si no existe, se usa el del sistema

function sistemaPrefiereOscuro() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function aplicarClase(esOscuro) {
  document.documentElement.classList.toggle('dark', esOscuro);
}

export function TemaProvider({ children }) {
  const [preferencia, setPreferencia] = useState(() => localStorage.getItem(CLAVE_STORAGE)); // null = automático
  const [esOscuro, setEsOscuro] = useState(() => (preferencia ? preferencia === 'oscuro' : sistemaPrefiereOscuro()));

  // Aplica la clase al <html> cada vez que cambia el resultado
  useEffect(() => {
    aplicarClase(esOscuro);
  }, [esOscuro]);

  // Si no hay preferencia manual guardada, sigue al sistema en tiempo real
  useEffect(() => {
    if (preferencia) return; // el cajero ya forzó un modo, no seguir al sistema
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setEsOscuro(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preferencia]);

  const alternar = useCallback(() => {
    setEsOscuro((actual) => {
      const nuevo = !actual;
      localStorage.setItem(CLAVE_STORAGE, nuevo ? 'oscuro' : 'claro');
      setPreferencia(nuevo ? 'oscuro' : 'claro');
      return nuevo;
    });
  }, []);

  const usarAutomatico = useCallback(() => {
    localStorage.removeItem(CLAVE_STORAGE);
    setPreferencia(null);
    setEsOscuro(sistemaPrefiereOscuro());
  }, []);

  return (
    <TemaContext.Provider value={{ esOscuro, alternar, usarAutomatico, esManual: preferencia !== null }}>
      {children}
    </TemaContext.Provider>
  );
}
