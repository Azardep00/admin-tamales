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

function tokenActual() {
  try {
    const guardado = localStorage.getItem(LLAVE_SESION);
    return guardado ? JSON.parse(guardado)?.token ?? null : null;
  } catch {
    return null;
  }
}

// Si el 401 no viene del propio intento de login, el token dejó de ser
// válido a mitad de la sesión (expiró). Limpiamos la sesión guardada y
// forzamos una recarga a /login, para que AuthContext arranque desde cero.
function manejarSesionExpirada() {
  localStorage.removeItem(LLAVE_SESION);
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

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
    const esIntentoDeLogin = ruta.includes('/usuarios/login');
    if (res.status === 401 && !esIntentoDeLogin) {
      manejarSesionExpirada();
    }

    const mensaje =
      (datos && typeof datos === 'object' && datos.mensaje) ||
      (typeof datos === 'string' && datos) ||
      `El servidor respondió ${res.status}.`;
    throw new ApiError(mensaje, res.status);
  }

  return datos;
}
