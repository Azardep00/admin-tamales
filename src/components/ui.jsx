import { useEffect, useRef } from 'react';
import { legible } from '../lib/format';

/* --- Etiquetas de estado --- */

export function EstadoPedido({ estado }) {
  return <span className={`pastilla pastilla--${estado?.toLowerCase()}`}>{legible(estado)}</span>;
}

export function Pastilla({ tono = 'neutra', children }) {
  return <span className={`pastilla pastilla--${tono}`}>{children}</span>;
}

/* --- Estados de la vista --- */

export function Cargando({ texto = 'Cargando' }) {
  return (
    <div className="estado-vista">
      <span className="girador" aria-hidden="true" />
      <p>{texto}</p>
    </div>
  );
}

export function ErrorVista({ mensaje, onReintentar }) {
  return (
    <div className="estado-vista estado-vista--error">
      <p className="estado-vista__titulo">No se pudieron cargar los datos</p>
      <p>{mensaje}</p>
      {onReintentar && (
        <button className="btn btn--contorno" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function Vacio({ titulo, descripcion, accion }) {
  return (
    <div className="estado-vista">
      <p className="estado-vista__titulo">{titulo}</p>
      {descripcion && <p>{descripcion}</p>}
      {accion}
    </div>
  );
}

/* --- Ventana modal --- */

export function Modal({ titulo, descripcion, onCerrar, children, ancho = 520 }) {
  const contenedor = useRef(null);

  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPresionar);
    document.body.style.overflow = 'hidden';
    contenedor.current?.querySelector('input, select, textarea, button')?.focus();
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = '';
    };
  }, [onCerrar]);

  return (
    <div className="telon" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" style={{ maxWidth: ancho }} role="dialog" aria-modal="true" ref={contenedor}>
        <header className="modal__cabecera">
          <div>
            <h2>{titulo}</h2>
            {descripcion && <p className="modal__descripcion">{descripcion}</p>}
          </div>
          <button className="btn-icono" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>
        <div className="modal__cuerpo">{children}</div>
      </div>
    </div>
  );
}

export function Confirmar({ titulo, mensaje, textoAccion, tono = 'peligro', onCerrar, onConfirmar, trabajando }) {
  return (
    <Modal titulo={titulo} onCerrar={onCerrar} ancho={420}>
      <p className="parrafo">{mensaje}</p>
      <div className="acciones-form">
        <button className="btn btn--contorno" onClick={onCerrar} disabled={trabajando}>
          Volver
        </button>
        <button className={`btn btn--${tono}`} onClick={onConfirmar} disabled={trabajando}>
          {trabajando ? 'Un momento' : textoAccion}
        </button>
      </div>
    </Modal>
  );
}

/* --- Formularios --- */

export function Campo({ etiqueta, ayuda, children }) {
  return (
    <label className="campo">
      <span className="campo__etiqueta">{etiqueta}</span>
      {children}
      {ayuda && <span className="campo__ayuda">{ayuda}</span>}
    </label>
  );
}

export function Fila({ children }) {
  return <div className="campo-fila">{children}</div>;
}

export function Selector({ valor, onChange, opciones, placeholder, ...props }) {
  return (
    <select value={valor} onChange={(e) => onChange(e.target.value)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {opciones.map((o) =>
        typeof o === 'string' ? (
          <option key={o} value={o}>
            {legible(o)}
          </option>
        ) : (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        )
      )}
    </select>
  );
}
