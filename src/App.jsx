import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './context/contextos';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Login from './pages/Login';
import Pedidos from './pages/Pedidos';
import Productos from './pages/Productos';
import Proveedores from './pages/Proveedores';
import Usuarios from './pages/Usuarios';

function Rutas() {
  const { sesion } = useAuth();

  if (!sesion) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="productos" element={<Productos />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Rutas />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
