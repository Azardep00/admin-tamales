import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { movimientos, pedidos, productos } from '../api';
import { Encabezado } from '../components/Layout';
import { Cargando, ErrorVista, EstadoPedido } from '../components/ui';
import {
  dinero,
  fechaHora,
  FLUJO_PEDIDO,
  haceCuanto,
  legible,
  nombreCompleto,
  numero,
  STOCK_MINIMO,
} from '../lib/format';
import { useAsync } from '../lib/useAsync';

// Colores tomados de la paleta de styles.css, para que las graficas
// se vean parte del mismo sistema de diseno (hoja, achiote, maiz...).
const COLOR_ACHIOTE = '#b8410f';
const COLOR_VERDE = '#16301f';
const COLOR_ORO = '#d6a23c';
const COLOR_EXITO = '#2f6b3f';
const COLOR_PELIGRO = '#a3341f';
const COLOR_SUAVE = '#5a4a3c';

const COLORES_ESTADO = {
  PENDIENTE: COLOR_ORO,
  CONFIRMADO: COLOR_SUAVE,
  EN_PREPARACION: COLOR_ACHIOTE,
  ENTREGADO: COLOR_EXITO,
  CANCELADO: COLOR_PELIGRO,
};

export default function Dashboard() {
  const { datos, cargando, error, recargar } = useAsync(
    () => Promise.all([pedidos.listar(), productos.listar(true), movimientos.listar()]),
    []
  );

  if (cargando) return <Cargando texto="Armando el resumen del día" />;
  if (error) return <ErrorVista mensaje={error} onReintentar={recargar} />;

  const [listaPedidos, listaProductos, listaMovimientos] = datos;

  const porEstado = (estado) => listaPedidos.filter((p) => p.estado === estado);
  const enCurso = listaPedidos.filter(
    (p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO'
  );
  const entregados = porEstado('ENTREGADO');
  const facturado = entregados.reduce((suma, p) => suma + Number(p.total ?? 0), 0);
  const comprometido = enCurso.reduce((suma, p) => suma + Number(p.total ?? 0), 0);

  const stockBajo = listaProductos
    .filter((p) => p.estado && p.stock <= STOCK_MINIMO)
    .sort((a, b) => a.stock - b.stock);

  const ultimosPedidos = [...listaPedidos]
    .sort((a, b) => b.idPedido - a.idPedido)
    .slice(0, 6);

  const ultimosMovimientos = [...listaMovimientos]
    .sort((a, b) => b.idMovimiento - a.idMovimiento)
    .slice(0, 6);

  // ---------------------------------------------------------------
  // Datos derivados SOLO para las graficas (no tocan la logica de
  // arriba, que ya usan las tarjetas y tablas existentes).
  // ---------------------------------------------------------------

  // Grafica 1: ventas (pedidos entregados) de los ultimos 7 dias.
  const hoy = new Date();
  const ventasPorDia = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(hoy);
    dia.setDate(hoy.getDate() - (6 - i));
    const etiqueta = dia.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
    const claveDia = dia.toDateString();

    const totalDia = entregados
      .filter((p) => new Date(p.fecha).toDateString() === claveDia)
      .reduce((suma, p) => suma + Number(p.total ?? 0), 0);

    return { dia: etiqueta, total: totalDia };
  });

  // Grafica 2: distribucion de pedidos por estado (incluye cancelados).
  const estadoData = [...FLUJO_PEDIDO, 'CANCELADO']
    .map((estado) => ({
      nombre: legible(estado),
      valor: porEstado(estado).length,
      color: COLORES_ESTADO[estado] ?? COLOR_SUAVE,
    }))
    .filter((e) => e.valor > 0);

  // Grafica 3: top 5 productos mas vendidos, segun los movimientos de
  // salida por venta (misma fuente que ya usa "Ultimos movimientos").
  const ventasPorProducto = {};
  listaMovimientos
    .filter((m) => m.tipo === 'SALIDA' && m.motivo?.toLowerCase().includes('venta'))
    .forEach((m) => {
      const nombre = m.producto?.nombre ?? 'Producto eliminado';
      ventasPorProducto[nombre] = (ventasPorProducto[nombre] ?? 0) + Number(m.cantidad ?? 0);
    });

  const topProductos = Object.entries(ventasPorProducto)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  return (
    <>
      <Encabezado
        titulo="Resumen"
        descripcion="Cómo va la operación en este momento."
        acciones={
          <button className="btn btn--contorno" onClick={recargar}>
            Actualizar
          </button>
        }
      />

      {/* El flujo de un pedido sí es una secuencia, por eso se dibuja como recorrido */}
      <section className="tablero">
        <h2 className="tablero__titulo">Pedidos en el flujo</h2>
        <ol className="flujo">
          {FLUJO_PEDIDO.map((estado) => {
            const cantidad = porEstado(estado).length;
            return (
              <li key={estado} className={`flujo__etapa ${cantidad === 0 ? 'es-vacia' : ''}`}>
                <span className="flujo__cifra">{cantidad}</span>
                <span className="flujo__nombre">{legible(estado)}</span>
              </li>
            );
          })}
        </ol>
        <p className="flujo__pie">
          {porEstado('CANCELADO').length} cancelados en total. Los pedidos avanzan una etapa a la
          vez y liberan stock si se cancelan.
        </p>
      </section>

      <section className="cifras">
        <article className="cifra">
          <span className="cifra__valor">{dinero(facturado)}</span>
          <span className="cifra__nombre">Vendido en pedidos entregados</span>
        </article>
        <article className="cifra">
          <span className="cifra__valor">{dinero(comprometido)}</span>
          <span className="cifra__nombre">Comprometido en pedidos por entregar</span>
        </article>
        <article className="cifra">
          <span className="cifra__valor">{numero(listaProductos.filter((p) => p.estado).length)}</span>
          <span className="cifra__nombre">Productos activos en catálogo</span>
        </article>
        <article className={`cifra ${stockBajo.length ? 'cifra--alerta' : ''}`}>
          <span className="cifra__valor">{numero(stockBajo.length)}</span>
          <span className="cifra__nombre">Productos con stock de {STOCK_MINIMO} o menos</span>
        </article>
      </section>

      {/* ---------- NUEVO: seccion de graficas ---------- */}
      <div className="rejilla-dos">
        <section className="panel">
          <div className="panel__cabecera">
            <h2>Ventas de los últimos 7 días</h2>
          </div>
          {facturado === 0 ? (
            <p className="panel__vacio">Aún no hay pedidos entregados para graficar.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dia" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => dinero(v)} />
                <Bar dataKey="total" fill={COLOR_ACHIOTE} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="panel">
          <div className="panel__cabecera">
            <h2>Pedidos por estado</h2>
          </div>
          {estadoData.length === 0 ? (
            <p className="panel__vacio">Todavía no hay pedidos registrados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={estadoData}
                  dataKey="valor"
                  nameKey="nombre"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {estadoData.map((entrada) => (
                    <Cell key={entrada.nombre} fill={entrada.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel__cabecera">
          <h2>Top 5 productos más vendidos</h2>
        </div>
        {topProductos.length === 0 ? (
          <p className="panel__vacio">Aún no hay ventas registradas en el inventario.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, topProductos.length * 45)}>
            <BarChart data={topProductos} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="nombre" fontSize={12} width={140} />
              <Tooltip formatter={(v) => `${v} unidades`} />
              <Bar dataKey="cantidad" fill={COLOR_VERDE} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
      {/* ---------- FIN seccion de graficas ---------- */}

      <div className="rejilla-dos">
        <section className="panel">
          <div className="panel__cabecera">
            <h2>Reponer pronto</h2>
            <Link className="enlace" to="/inventario">
              Registrar entrada
            </Link>
          </div>
          {stockBajo.length === 0 ? (
            <p className="panel__vacio">Todo el catálogo está por encima del mínimo.</p>
          ) : (
            <ul className="lista-stock">
              {stockBajo.slice(0, 6).map((p) => (
                <li key={p.idProducto}>
                  <span className="lista-stock__nombre">{p.nombre}</span>
                  <span className={`lista-stock__cantidad ${p.stock === 0 ? 'es-critico' : ''}`}>
                    {p.stock === 0 ? 'Agotado' : `${p.stock} en bodega`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel__cabecera">
            <h2>Últimos movimientos de inventario</h2>
            <Link className="enlace" to="/inventario">
              Ver todos
            </Link>
          </div>
          {ultimosMovimientos.length === 0 ? (
            <p className="panel__vacio">Todavía no hay movimientos registrados.</p>
          ) : (
            <ul className="lista-movimientos">
              {ultimosMovimientos.map((m) => (
                <li key={m.idMovimiento}>
                  <span className={`marca-mov marca-mov--${m.tipo.toLowerCase()}`}>
                    {m.tipo === 'ENTRADA' ? `+${m.cantidad}` : `−${m.cantidad}`}
                  </span>
                  <span className="lista-movimientos__texto">
                    <strong>{m.producto?.nombre ?? 'Producto eliminado'}</strong>
                    <span>{m.motivo}</span>
                  </span>
                  <span className="lista-movimientos__fecha">{haceCuanto(m.fecha)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel__cabecera">
          <h2>Pedidos recientes</h2>
          <Link className="enlace" to="/pedidos">
            Ver todos
          </Link>
        </div>
        {ultimosPedidos.length === 0 ? (
          <p className="panel__vacio">
            Aún no hay pedidos. Crea uno desde la sección de pedidos o deja que entren desde la
            tienda del cliente.
          </p>
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="alinea-derecha">Total</th>
                </tr>
              </thead>
              <tbody>
                {ultimosPedidos.map((p) => (
                  <tr key={p.idPedido}>
                    <td className="celda-id">#{p.idPedido}</td>
                    <td>{nombreCompleto(p.cliente)}</td>
                    <td>{fechaHora(p.fecha)}</td>
                    <td>
                      <EstadoPedido estado={p.estado} />
                    </td>
                    <td className="alinea-derecha celda-numero">{dinero(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}