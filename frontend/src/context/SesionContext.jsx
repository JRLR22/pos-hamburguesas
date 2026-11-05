import { useState, useCallback, useEffect } from 'react';
import { api, fijarToken, restaurarSesion, SESION_EXPIRADA } from '../lib/api';
import { SesionContext } from './contextos';

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  // Mientras se intenta restaurar la sesión con la cookie, no mostramos el
  // login todavía (si no, se vería un parpadeo de login -> pantalla real).
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    restaurarSesion()
      .then((datos) => setSesion(datos ? { usuario: datos.usuario } : null))
      .finally(() => setVerificando(false));
  }, []);

  useEffect(() => {
    function alExpirar() {
      fijarToken(null);
      setSesion(null);
    }
    window.addEventListener(SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(SESION_EXPIRADA, alExpirar);
  }, []);

  const iniciarSesion = useCallback(async (usuario, password) => {
    // El access token vive solo en memoria dentro de lib/api.js, nunca en el estado ni en localStorage
    const { usuario: datosUsuario } = await api.login(usuario, password);
    setSesion({ usuario: datosUsuario });
  }, []);

  const cerrarSesion = useCallback(async () => {
    await api.logout();
    setSesion(null);
  }, []);

  if (verificando) {
    return (
      <div className="h-dvh flex items-center justify-center text-ink-muted text-sm">Conectando con el servidor...</div>
    );
  }

  return <SesionContext.Provider value={{ sesion, iniciarSesion, cerrarSesion }}>{children}</SesionContext.Provider>;
}
