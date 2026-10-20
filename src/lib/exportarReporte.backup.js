import * as XLSX from 'xlsx';
import { dinero, fechaHora, legible, nombreCompleto } from './format';

// Genera y descarga un Excel con dos hojas: ventas del mes (pedidos
// entregados) y movimientos de inventario del mes. Todo corre en el
// navegador, sin pedirle nada nuevo al backend.
export function exportarReporteMensual(pedidos, movimientos) {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const dentroDelMes = (fechaIso) => {
    const f = new Date(fechaIso);
    return f >= inicioMes && f <= ahora;
  };

  // ---------- Hoja 1: ventas del mes (pedidos entregados) ----------
  const pedidosDelMes = pedidos.filter((p) => p.estado === 'ENTREGADO' && dentroDelMes(p.fecha));

  const filasVentas = pedidosDelMes.map((p) => ({
    'N.o pedido': p.idPedido,
    Cliente: nombreCompleto(p.cliente),
    Fecha: fechaHora(p.fecha),
    Estado: legible(p.estado),
    Total: Number(p.total ?? 0),
  }));

  const totalVentas = filasVentas.reduce((suma, f) => suma + f.Total, 0);
  filasVentas.push({ 'N.o pedido': '', Cliente: '', Fecha: '', Estado: 'Total del mes', Total: totalVentas });

  // ---------- Hoja 2: movimientos de inventario del mes ----------
  const movimientosDelMes = movimientos.filter((m) => dentroDelMes(m.fecha));

  const filasMovimientos = movimientosDelMes.map((m) => ({
    Fecha: fechaHora(m.fecha),
    Producto: m.producto?.nombre ?? 'Producto eliminado',
    Tipo: legible(m.tipo),
    Cantidad: m.tipo === 'ENTRADA' ? m.cantidad : -m.cantidad,
    Motivo: m.motivo ?? '',
  }));

  // ---------- Arma el libro y lo descarga ----------
  const libro = XLSX.utils.book_new();

  const hojaVentas = XLSX.utils.json_to_sheet(filasVentas);
  hojaVentas['!cols'] = [{ wch: 10 }, { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(libro, hojaVentas, 'Ventas del mes');

  const hojaMovimientos = XLSX.utils.json_to_sheet(filasMovimientos);
  hojaMovimientos['!cols'] = [{ wch: 18 }, { wch: 24 }, { wch: 12 }, { wch: 10 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(libro, hojaMovimientos, 'Movimientos de inventario');

  const nombreMes = ahora.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const nombreArchivo = `reporte-tamales-lechona-${nombreMes.replace(' ', '-')}.xlsx`;

  XLSX.writeFile(libro, nombreArchivo);
}