import { useEffect, useState, useCallback } from 'react';

/**
 * Carga datos de la API y los mantiene en estado.
 *
 *   const { datos, error, cargando, recargar } = useRecurso(api.listarProductos);
 *   const cocina = useRecurso(api.listarCocina, { intervalo: 5000 });
 *
 * - `cargador` debe ser estable (función de módulo o envuelta en useCallback):
 *   cuando cambia se vuelve a cargar (útil para filtros como la fecha) y
 *   `cargando` vuelve a true hasta que llegan los datos nuevos.
 * - Ignora respuestas que llegan después de desmontar o de cambiar el
 *   cargador, así una respuesta lenta no pisa a una más reciente.
 * - Con `intervalo` hace polling; si ya hay datos, un fallo puntual no borra
 *   lo que se ve en pantalla.
 */
export function useRecurso(cargador, { intervalo } = {}) {
  // `origen` = qué cargador produjo estos datos; si no coincide con el actual, son de otro filtro
  const [estado, setEstado] = useState({ datos: undefined, error: '', origen: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    const cargar = () =>
      cargador().then(
        (datos) => vigente && setEstado({ datos, error: '', origen: cargador }),
        (err) => vigente && setEstado((previo) => ({ ...previo, error: err.message, origen: cargador }))
      );

    cargar();
    const id = intervalo ? setInterval(cargar, intervalo) : null;
    return () => {
      vigente = false;
      if (id) clearInterval(id);
    };
  }, [cargador, intervalo, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { datos: estado.datos, error: estado.error, cargando: estado.origen !== cargador, recargar };
}
