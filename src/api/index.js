import { api } from './client';

/**
 * Un método por cada endpoint expuesto por el backend.
 * Si el backend cambia, este archivo es el único que se toca.
 */

export const pedidos = {
  listar: (params) => api('/pedidos', { params }),
  buscarPorId: (id) => api(`/pedidos/${id}`),
  crear: (idCliente, detalles) => api('/pedidos', { method: 'POST', body: { idCliente, detalles } }),
  cambiarEstado: (id, estado) =>
    api(`/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } }),
  cancelar: (id) => api(`/pedidos/${id}`, { method: 'DELETE' }),
};

export const productos = {
  listar: (incluirInactivos = false) => api('/productos', { params: { incluirInactivos } }),
  buscarPorId: (id) => api(`/productos/${id}`),
  buscarPorNombre: (nombre) => api('/productos/buscar', { params: { nombre } }),
  crearTamal: (tamal) =>
    api('/productos/tamales', { method: 'POST', body: { tipoProducto: 'Tamal', ...tamal } }),
  crearLechona: (lechona) =>
    api('/productos/lechonas', { method: 'POST', body: { tipoProducto: 'Lechona', ...lechona } }),
  actualizar: (id, producto) => api(`/productos/${id}`, { method: 'PUT', body: producto }),
  desactivar: (id) => api(`/productos/${id}`, { method: 'DELETE' }),
};

export const movimientos = {
  listar: (params) => api('/movimientos', { params }),
  buscarPorId: (id) => api(`/movimientos/${id}`),
  registrarEntrada: (body) => api('/movimientos/entradas', { method: 'POST', body }),
  registrarSalida: (body) => api('/movimientos/salidas', { method: 'POST', body }),
  registrarReversion: (body) => api('/movimientos/reversiones', { method: 'POST', body }),
};

export const proveedores = {
  listar: (incluirInactivos = false) => api('/proveedores', { params: { incluirInactivos } }),
  buscarPorId: (id) => api(`/proveedores/${id}`),
  buscar: (q) => api('/proveedores/buscar', { params: { q } }),
  registrar: (proveedor) => api('/proveedores', { method: 'POST', body: proveedor }),
  actualizar: (id, proveedor) => api(`/proveedores/${id}`, { method: 'PUT', body: proveedor }),
  desactivar: (id) => api(`/proveedores/${id}`, { method: 'DELETE' }),
};

export const usuarios = {
  listar: (incluirInactivos = false) => api('/usuarios', { params: { incluirInactivos } }),
  buscarPorId: (id) => api(`/usuarios/${id}`),
  buscarPorCorreo: (correo) => api('/usuarios/buscar', { params: { correo } }),
  crearCliente: (cliente) =>
    api('/usuarios/clientes', { method: 'POST', body: { tipoUsuario: 'Cliente', ...cliente } }),
  crearEmpleado: (empleado) =>
    api('/usuarios/empleados', { method: 'POST', body: { tipoUsuario: 'Empleado', ...empleado } }),
  actualizar: (id, usuario) => api(`/usuarios/${id}`, { method: 'PUT', body: usuario }),
  cambiarContrasena: (id, contrasenaActual, contrasenaNueva) =>
    api(`/usuarios/${id}/contrasena`, {
      method: 'PATCH',
      body: { contrasenaActual, contrasenaNueva },
    }),
  desactivar: (id) => api(`/usuarios/${id}`, { method: 'DELETE' }),
  login: (correo, contrasena) =>
    api('/usuarios/login', { method: 'POST', body: { correo, contrasena } }),
};

export const integracion = {
  clima: () => api('/integracion/clima'),
};
