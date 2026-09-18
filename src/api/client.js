const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.status = status;
  }
}

function queryString(params) {
  if (!params) return '';
  const entradas = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  return entradas.length ? `?${new URLSearchParams(entradas)}` : '';
}

/**
 * Envoltura única sobre fetch. El backend responde los errores como
 * { "mensaje": "..." } (GlobalExceptionHandler.ErrorResponse), así que
 * traducimos eso a un ApiError con el texto que el usuario debe leer.
 */
export async function api(ruta, { method = 'GET', body, params } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${ruta}${queryString(params)}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No hay conexión con el servidor. Revisa que el backend esté corriendo en el puerto 8080.', 0);
  }

  if (res.status === 204) return null;

  const texto = await res.text();
  let datos = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = texto;
    }
  }

  if (!res.ok) {
    const mensaje =
      (datos && typeof datos === 'object' && datos.mensaje) ||
      (typeof datos === 'string' && datos) ||
      `El servidor respondió ${res.status}.`;
    throw new ApiError(mensaje, res.status);
  }

  return datos;
}
