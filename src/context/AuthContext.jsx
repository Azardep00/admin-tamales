import { useCallback, useMemo, useState } from 'react';
import { usuarios } from '../api';
import { AuthContext } from './contextos';

const LLAVE = 'admin-tamales:sesion';

function leerSesion() {
  try {
    const guardado = localStorage.getItem(LLAVE);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);

  const entrar = useCallback(async (correo, contrasena) => {
    const datos = await usuarios.login(correo, contrasena);
    // El backend autentica a cualquier usuario activo. El panel administrativo
    // solo debe abrirse para empleados, así que el filtro va aquí.
    if (datos.tipoUsuario !== 'Empleado') {
      throw new Error('Esta cuenta es de cliente. El panel es solo para empleados.');
    }
    localStorage.setItem(LLAVE, JSON.stringify(datos));
    setSesion(datos);
    return datos;
  }, []);

  const salir = useCallback(() => {
    localStorage.removeItem(LLAVE);
    setSesion(null);
  }, []);

  const valor = useMemo(() => ({ sesion, entrar, salir }), [sesion, entrar, salir]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
