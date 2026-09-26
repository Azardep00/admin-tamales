import { Fragment, useEffect, useState } from 'react';
import { pedidos as apiPedidos, productos as apiProductos, usuarios as apiUsuarios } from '../api';
import { Encabezado } from '../components/Layout';
import { Campo, Cargando, Confirmar, ErrorVista, EstadoPedido, Modal, Selector, Vacio } from '../components/ui';
import { useToast } from '../context/contextos';
import {
  dinero,
  ESTADOS_PEDIDO,
  fechaHora,
  legible,
  nombreCompleto,
  puedeCancelarse,
  SIGUIENTE_ESTADO,
} from '../lib/format';
import { useAsync } from '../lib/useAsync';

export default function Pedidos() {
  const toast = useToast();
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [expandido, setExpandido] = useState(null);
  const [creando, setCreando] = useState(false);
  const [cancelando, setCancelando] = useState(null);
  const [trabajando, setTrabajando] = useState(false);

  // El backend solo acepta un filtro a la vez: si hay cliente, manda cliente.
  const { datos, cargando, error, recargar } = useAsync(
    () =>
      apiPedidos.listar(
        filtroCliente ? { idCliente: filtroCliente } : filtroEstado ? { estado: filtroEstado } : undefined
      ),
    [filtroEstado, filtroCliente]
  );

  useEffect(() => {
    const onPedidoNuevo = () => recargar();
    window.addEventListener('pedidos:nuevo', onPedidoNuevo);
    return () => window.removeEventListener('pedidos:nuevo', onPedidoNuevo);
  }, [recargar]);

  const { datos: listaUsuarios } = useAsync(() => apiUsuarios.listar(), []);
  const clientes = (listaUsuarios ?? []).filter((u) => u.tipoUsuario === 'Cliente' && u.estado);

  const avanzar = async (pedido) => {
    const siguiente = SIGUIENTE_ESTADO[pedido.estado];
    if (!siguiente) return;
    setTrabajando(true);
    try {
      await apiPedidos.cambiarEstado(pedido.idPedido, siguiente);
      toast.exito(`Pedido #${pedido.idPedido} pasó a ${legible(siguiente).toLowerCase()}`);
      recargar();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTrabajando(false);
    }
  };

  const cancelar = async () => {
    setTrabajando(true);
    try {
      await apiPedidos.cancelar(cancelando.idPedido);
      toast.exito(`Pedido #${cancelando.idPedido} cancelado y stock devuelto al inventario`);
      setCancelando(null);
      recargar();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <>
      <Encabezado
        titulo="Pedidos"
        descripcion="Cada pedido avanza una etapa a la vez. Cancelar devuelve el stock automáticamente."
        acciones={
          <button className="btn btn--principal" onClick={() => setCreando(true)}>
            Crear pedido
          </button>
        }
      />

      <div className="barra-filtros">
        <Campo etiqueta="Estado">
          <Selector
            valor={filtroEstado}
            onChange={(v) => {
              setFiltroEstado(v);
              setFiltroCliente('');
            }}
            opciones={ESTADOS_PEDIDO}
            placeholder="Todos"
          />
        </Campo>
        <Campo etiqueta="Cliente">
          <Selector
            valor={filtroCliente}
            onChange={(v) => {
              setFiltroCliente(v);
              setFiltroEstado('');
            }}
            opciones={clientes.map((c) => ({ valor: String(c.idUsuario), texto: nombreCompleto(c) }))}
            placeholder="Todos"
          />
        </Campo>
        {(filtroEstado || filtroCliente) && (
          <button
            className="btn btn--fantasma btn--fantasma-oscuro"
            onClick={() => {
              setFiltroEstado('');
              setFiltroCliente('');
            }}
          >
            Quitar filtros
          </button>
        )}
      </div>

      {cargando && <Cargando texto="Buscando pedidos" />}
      {error && <ErrorVista mensaje={error} onReintentar={recargar} />}

      {!cargando && !error && datos.length === 0 && (
        <Vacio
          titulo="No hay pedidos que mostrar"
          descripcion={
            filtroEstado || filtroCliente
              ? 'Ningún pedido coincide con el filtro aplicado.'
              : 'Crea el primero aquí o espera a que entre uno desde la tienda.'
          }
          accion={
            <button className="btn btn--principal" onClick={() => setCreando(true)}>
              Crear pedido
            </button>
          }
        />
      )}

      {!cargando && !error && datos.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="alinea-derecha">Total</th>
                <th className="alinea-derecha">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[...datos]
                .sort((a, b) => b.idPedido - a.idPedido)
                .map((p) => (
                  <Fragment key={p.idPedido}>
                    <tr>
                      <td className="celda-id">
                        <button
                          className="boton-expandir"
                          onClick={() => setExpandido(expandido === p.idPedido ? null : p.idPedido)}
                          aria-expanded={expandido === p.idPedido}
                        >
                          #{p.idPedido}
                          <span className="boton-expandir__flecha">
                            {expandido === p.idPedido ? '▾' : '▸'}
                          </span>
                        </button>
                      </td>
                      <td>
                        <span className="celda-principal">{nombreCompleto(p.cliente)}</span>
                        <span className="celda-secundaria">{p.cliente?.direccion ?? ''}</span>
                      </td>
                      <td>{fechaHora(p.fecha)}</td>
                      <td>
                        <EstadoPedido estado={p.estado} />
                      </td>
                      <td className="alinea-derecha celda-numero">{dinero(p.total)}</td>
                      <td className="alinea-derecha">
                        <div className="acciones-celda">
                          {SIGUIENTE_ESTADO[p.estado] && (
                            <button
                              className="btn btn--pequeno btn--principal"
                              onClick={() => avanzar(p)}
                              disabled={trabajando}
                            >
                              Pasar a {legible(SIGUIENTE_ESTADO[p.estado]).toLowerCase()}
                            </button>
                          )}
                          {puedeCancelarse(p.estado) && (
                            <button
                              className="btn btn--pequeno btn--contorno"
                              onClick={() => setCancelando(p)}
                              disabled={trabajando}
                            >
                              Cancelar
                            </button>
                          )}
                          {!puedeCancelarse(p.estado) && !SIGUIENTE_ESTADO[p.estado] && (
                            <span className="texto-apagado">Cerrado</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandido === p.idPedido && (
                      <tr className="fila-detalle">
                        <td colSpan={6}>
                          <div className="detalle-pedido">
                            <h3>Productos del pedido</h3>
                            <table className="tabla tabla--anidada">
                              <thead>
                                <tr>
                                  <th>Producto</th>
                                  <th className="alinea-derecha">Cantidad</th>
                                  <th className="alinea-derecha">Precio al momento</th>
                                  <th className="alinea-derecha">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(p.detalles ?? []).map((d) => (
                                  <tr key={d.idDetallePedido}>
                                    <td>{d.producto?.nombre ?? 'Producto eliminado'}</td>
                                    <td className="alinea-derecha celda-numero">{d.cantidad}</td>
                                    <td className="alinea-derecha celda-numero">
                                      {dinero(d.precioUnitario)}
                                    </td>
                                    <td className="alinea-derecha celda-numero">{dinero(d.subtotal)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <p className="detalle-pedido__nota">
                              El precio guardado es el que tenía el producto cuando se creó el
                              pedido, aunque después haya cambiado en el catálogo.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {creando && (
        <FormularioPedido
          clientes={clientes}
          onCerrar={() => setCreando(false)}
          onCreado={() => {
            setCreando(false);
            recargar();
          }}
        />
      )}

      {cancelando && (
        <Confirmar
          titulo={`Cancelar el pedido #${cancelando.idPedido}`}
          mensaje="El pedido queda marcado como cancelado y cada producto vuelve al inventario. El registro no se borra."
          textoAccion="Cancelar pedido"
          trabajando={trabajando}
          onCerrar={() => setCancelando(null)}
          onConfirmar={cancelar}
        />
      )}
    </>
  );
}

/* --- Creación de pedido --- */

function FormularioPedido({ clientes, onCerrar, onCreado }) {
  const toast = useToast();
  const { datos: catalogo, cargando } = useAsync(() => apiProductos.listar(), []);
  const [idCliente, setIdCliente] = useState('');
  const [lineas, setLineas] = useState([{ idProducto: '', cantidad: 1 }]);
  const [guardando, setGuardando] = useState(false);

  const disponibles = catalogo ?? [];
  const buscarProducto = (id) => disponibles.find((p) => String(p.idProducto) === String(id));

  const total = lineas.reduce((suma, l) => {
    const p = buscarProducto(l.idProducto);
    return suma + (p ? Number(p.precio) * Number(l.cantidad || 0) : 0);
  }, 0);

  const cambiarLinea = (i, campo, valor) =>
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)));

  const guardar = async (e) => {
    e.preventDefault();
    const detalles = lineas
      .filter((l) => l.idProducto && Number(l.cantidad) > 0)
      .map((l) => ({ idProducto: Number(l.idProducto), cantidad: Number(l.cantidad) }));

    if (!idCliente) return toast.error('Elige el cliente del pedido.');
    if (detalles.length === 0) return toast.error('Agrega al menos un producto.');

    setGuardando(true);
    try {
      const creado = await apiPedidos.crear(Number(idCliente), detalles);
      toast.exito(`Pedido #${creado.idPedido} creado por ${dinero(creado.total)}`);
      onCreado();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo="Crear pedido"
      descripcion="El stock se descuenta al guardar. Si un producto no alcanza, el pedido completo se rechaza."
      onCerrar={onCerrar}
      ancho={640}
    >
      {cargando ? (
        <Cargando texto="Cargando catálogo" />
      ) : (
        <form onSubmit={guardar}>
          <Campo etiqueta="Cliente">
            <Selector
              valor={idCliente}
              onChange={setIdCliente}
              opciones={clientes.map((c) => ({
                valor: String(c.idUsuario),
                texto: `${nombreCompleto(c)} — ${c.correo}`,
              }))}
              placeholder="Selecciona un cliente"
              required
            />
          </Campo>

          <div className="lineas">
            <span className="campo__etiqueta">Productos</span>
            {lineas.map((l, i) => {
              const producto = buscarProducto(l.idProducto);
              const excede = producto && Number(l.cantidad) > producto.stock;
              return (
                <div className="linea" key={i}>
                  <select
                    value={l.idProducto}
                    onChange={(e) => cambiarLinea(i, 'idProducto', e.target.value)}
                  >
                    <option value="">Elige un producto</option>
                    {disponibles.map((p) => (
                      <option key={p.idProducto} value={p.idProducto} disabled={p.stock === 0}>
                        {p.nombre} — {dinero(p.precio)} ({p.stock} disp.)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={l.cantidad}
                    onChange={(e) => cambiarLinea(i, 'cantidad', e.target.value)}
                    className={excede ? 'es-invalido' : ''}
                    aria-label="Cantidad"
                  />
                  <button
                    type="button"
                    className="btn-icono"
                    onClick={() => setLineas((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={lineas.length === 1}
                    aria-label="Quitar producto"
                  >
                    ×
                  </button>
                  {excede && (
                    <p className="error-linea error-linea--compacta">
                      Solo hay {producto.stock} en bodega.
                    </p>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              className="btn btn--fantasma btn--fantasma-oscuro"
              onClick={() => setLineas((prev) => [...prev, { idProducto: '', cantidad: 1 }])}
            >
              Agregar otro producto
            </button>
          </div>

          <div className="total-previo">
            <span>Total del pedido</span>
            <strong>{dinero(total)}</strong>
          </div>

          <div className="acciones-form">
            <button type="button" className="btn btn--contorno" onClick={onCerrar}>
              Volver
            </button>
            <button className="btn btn--principal" disabled={guardando}>
              {guardando ? 'Guardando' : 'Crear pedido'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
