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

function leerSesion() {
  try {
    const guardado = localStorage.getItem(LLAVE_SESION);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

function guardarSesion(sesion) {
  localStorage.setItem(LLAVE_SESION, JSON.stringify(sesion));
}

function manejarSesionInvalida() {
  localStorage.removeItem(LLAVE_SESION);
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

// Si varias peticiones reciben 401 al mismo tiempo, todas esperan a ESTA
// misma promesa en vez de pedir cada una su propio refresh (si no, el
// refresh token se rotaria varias veces y las demas fallarian).
let renovacionEnCurso = null;

async function renovarSesion() {
  if (renovacionEnCurso) return renovacionEnCurso;

  const actual = leerSesion();
  if (!actual?.refreshToken) throw new Error('No hay sesión para renovar.');

  renovacionEnCurso = fetch(`${BASE}/usuarios/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: actual.refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('refresh invalido');
      const sesionNueva = await res.json();
      guardarSesion(sesionNueva);
      return sesionNueva;
    })
    .finally(() => {
      renovacionEnCurso = null;
    });

  return renovacionEnCurso;
}

async function peticion(ruta, { method, body, params, token }) {
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
    throw new ApiError(
      'No hay conexión con el servidor. Revisa que el backend esté corriendo en el puerto 8080.',
      0
    );
  }

  const texto = res.status === 204 ? '' : await res.text();
  let datos = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = texto;
    }
  }

  return { res, datos };
}

export async function api(ruta, { method = 'GET', body, params } = {}) {
  const esIntentoDeLogin = ruta.includes('/usuarios/login');
  const esIntentoDeRefresh = ruta.includes('/usuarios/refresh');

  const sesion = leerSesion();
  let { res, datos } = await peticion(ruta, { method, body, params, token: sesion?.token });

  // Un 401 en una ruta protegida (no login, no el propio refresh) intenta
  // renovarse solo una vez, y si funciona, reintenta la peticion original
  // con el token nuevo, sin que la pantalla que llamo a api() note nada.
  const puedeReintentar = res.status === 401 && !esIntentoDeLogin && !esIntentoDeRefresh && sesion;

  if (puedeReintentar) {
    try {
      const sesionNueva = await renovarSesion();
      ({ res, datos } = await peticion(ruta, { method, body, params, token: sesionNueva.token }));
    } catch {
      manejarSesionInvalida();
      throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);
    }
  }

  if (res.status === 204) return null;

  if (!res.ok) {
    if (res.status === 401 && !esIntentoDeLogin) {
      manejarSesionInvalida();
    }

    const mensaje =
      (datos && typeof datos === 'object' && datos.mensaje) ||
      (typeof datos === 'string' && datos) ||
      `El servidor respondió ${res.status}.`;
    throw new ApiError(mensaje, res.status);
  }

  return datos;
}