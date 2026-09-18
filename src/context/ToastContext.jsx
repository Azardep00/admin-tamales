import { useCallback, useMemo, useState } from 'react';
import { ToastContext } from './contextos';

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);

  const cerrar = useCallback((id) => {
    setAvisos((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const mostrar = useCallback(
    (texto, tono = 'exito') => {
      const id = crypto.randomUUID();
      setAvisos((prev) => [...prev, { id, texto, tono }]);
      setTimeout(() => cerrar(id), tono === 'error' ? 7000 : 4000);
    },
    [cerrar]
  );

  const valor = useMemo(
    () => ({
      exito: (t) => mostrar(t, 'exito'),
      error: (t) => mostrar(t, 'error'),
    }),
    [mostrar]
  );

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`aviso aviso--${a.tono}`}>
            <span>{a.texto}</span>
            <button className="aviso__cerrar" onClick={() => cerrar(a.id)} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
