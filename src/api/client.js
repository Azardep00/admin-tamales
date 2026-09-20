const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
const LLAVE_SESION = 'admin-tamales:sesion';

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

// Mismo lugar donde AuthContext guarda la sesión. La leemos directo de
// localStorage aquí (en vez de importar el contexto) para no crear una
// dependencia circular entre api/ y context/.
function tokenActual() {
  try {
    const guardado = localStorage.getItem(LLAVE_SESION);
    return guardado ? JSON.parse(guardado)?.token ?? null : null;
  } catch {
    return null;
  }
}

/**
 * Envoltura única sobre fetch. El backend responde los errores como
 * { "mensaje": "..." } (GlobalExceptionHandler.ErrorResponse), así que
 * traducimos eso a un ApiError con el texto que el usuario debe leer.
 */
export async function api(ruta, { method = 'GET', body, params } = {}) {
  const token = tokenActual();

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${ruta}${queryString(params)}`, {
      method,
      headers,
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
