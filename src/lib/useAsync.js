import { useCallback, useEffect, useState } from 'react';

/**
 * Ejecuta una función asíncrona y expone { datos, cargando, error, recargar }.
 * Las dependencias se comparan serializadas, así que basta con pasar los
 * filtros de la vista. Las respuestas de peticiones viejas se descartan para
 * que un filtro rápido no sobrescriba el resultado del filtro nuevo.
 */
export function useAsync(fn, deps = []) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pulso, setPulso] = useState(0);

  const clave = JSON.stringify(deps);
  const recargar = useCallback(() => setPulso((p) => p + 1), []);

  useEffect(() => {
    let vigente = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);

    fn()
      .then((resultado) => {
        if (!vigente) return;
        setDatos(resultado);
        setError(null);
      })
      .catch((e) => {
        if (vigente) setError(e.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, pulso]);

  return { datos, cargando, error, recargar, setDatos };
}

/** Rebota un valor para no disparar una búsqueda por cada tecla. */
export function useDebounce(valor, ms = 350) {
  const [rebotado, setRebotado] = useState(valor);

  useEffect(() => {
    const t = setTimeout(() => setRebotado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);

  return rebotado;
}
