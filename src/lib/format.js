const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export const dinero = (v) => (v === null || v === undefined ? '—' : pesos.format(Number(v)));

export const numero = (v) => new Intl.NumberFormat('es-CO').format(Number(v ?? 0));

/** Jackson puede mandar la fecha como ISO o como arreglo; aceptamos ambas. */
function aDate(valor) {
  if (!valor) return null;
  if (Array.isArray(valor)) {
    const [a, m, d, h = 0, min = 0, s = 0] = valor;
    return new Date(a, m - 1, d, h, min, s);
  }
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fechaHora(valor) {
  const d = aDate(valor);
  if (!d) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fecha(valor) {
  const d = aDate(valor);
  if (!d) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function haceCuanto(valor) {
  const d = aDate(valor);
  if (!d) return '';
  const minutos = Math.round((Date.now() - d.getTime()) / 60000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
}

/** Convierte PENDIENTE / EN_PREPARACION en texto legible. */
export const legible = (enumStr) => {
  if (!enumStr) return '—';
  const t = enumStr.replace(/_/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const nombreCompleto = (u) => (u ? `${u.nombre ?? ''} ${u.apellido ?? ''}`.trim() : '—');

// --- Reglas de negocio replicadas del backend (PedidoService.siguienteEstado) ---

export const ESTADOS_PEDIDO = [
  'PENDIENTE',
  'CONFIRMADO',
  'EN_PREPARACION',
  'ENTREGADO',
  'CANCELADO',
];

export const FLUJO_PEDIDO = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'ENTREGADO'];

export const SIGUIENTE_ESTADO = {
  PENDIENTE: 'CONFIRMADO',
  CONFIRMADO: 'EN_PREPARACION',
  EN_PREPARACION: 'ENTREGADO',
};

export const puedeCancelarse = (estado) => estado !== 'ENTREGADO' && estado !== 'CANCELADO';

export const TIPOS_TAMAL = ['NORMAL', 'PICANTE'];
export const TAMANOS_TAMAL = ['PEQUENO', 'MEDIANO', 'GRANDE'];
export const TAMANOS_LECHONA = ['PEQUENA', 'MEDIANA', 'GRANDE'];
export const TIPOS_CLIENTE = ['NUEVO', 'FRECUENTE', 'PREMIUM'];

/** Mismo umbral que inventario.stock-minimo en application.properties. */
export const STOCK_MINIMO = 5;
