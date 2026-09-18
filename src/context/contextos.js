import { createContext, useContext } from 'react';

// Los contextos y sus hooks viven aparte de los proveedores para que cada
// archivo .jsx exporte solo componentes y el refresco en caliente de Vite
// siga funcionando al editarlos.

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);
