import { useState } from 'react';
import { movimientos as api, productos as apiProductos, proveedores as apiProveedores } from '../api';
import { Encabezado } from '../components/Layout';
import { Campo, Cargando, ErrorVista, Modal, Selector, Vacio } from '../components/ui';
import { useToast } from '../context/contextos';
import { fechaHora, numero } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const TIPOS_REGISTRO = [
  {
    clave: 'entrada',
    titulo: 'Entrada',
    descripcion: 'Llegó mercancía de un proveedor. Suma al stock.',
  },
  {
    clave: 'salida',
    titulo: 'Salida',
    descripcion: 'Se fue mercancía sin pasar por un pedido: merma, daño, consumo interno.',
  },
  {
    clave: 'reversion',
    titulo: 'Reversión',
    descripcion: 'Corrige una salida equivocada. Devuelve las unidades al stock.',
  },
];

export default function Inventario() {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [registrando, setRegistrando] = useState(null);

  const { datos, cargando, error, recargar } = useAsync(
    () =>
      api.listar(
        filtroProducto ? { idProducto: filtroProducto } : filtroTipo ? { tipo: filtroTipo } : undefined
      ),
    [filtroTipo, filtroProducto]
  );

  const { datos: catalogo, recargar: recargarCatalogo } = useAsync(
    () => apiProductos.listar(true),
    []
  );
  const { datos: listaProveedores } = useAsync(() => apiProveedores.listar(), []);

  const lista = datos ?? [];
  const entradas = lista.filter((m) => m.tipo === 'ENTRADA').reduce((s, m) => s + m.cantidad, 0);
  const salidas = lista.filter((m) => m.tipo === 'SALIDA').reduce((s, m) => s + m.cantidad, 0);

  return (
    <>
      <Encabezado
        titulo="Inventario"
        descripcion="Cada movimiento ajusta el stock y queda registrado con su motivo."
        acciones={
          <div className="acciones-celda">
            {TIPOS_REGISTRO.map((t) => (
              <button
                key={t.clave}
                className={`btn ${t.clave === 'entrada' ? 'btn--principal' : 'btn--contorno'}`}
                onClick={() => setRegistrando(t.clave)}
              >
                {t.titulo}
              </button>
            ))}
          </div>
        }
      />

      <div className="cifras cifras--tres">
        <article className="cifra">
          <span className="cifra__valor">{numero(entradas)}</span>
          <span className="cifra__nombre">Unidades que entraron</span>
        </article>
        <article className="cifra">
          <span className="cifra__valor">{numero(salidas)}</span>
          <span className="cifra__nombre">Unidades que salieron</span>
        </article>
        <article className="cifra">
          <span className="cifra__valor">{numero(lista.length)}</span>
          <span className="cifra__nombre">Movimientos en la vista</span>
        </article>
      </div>

      <div className="barra-filtros">
        <Campo etiqueta="Tipo de movimiento">
          <Selector
            valor={filtroTipo}
            onChange={(v) => {
              setFiltroTipo(v);
              setFiltroProducto('');
            }}
            opciones={['ENTRADA', 'SALIDA']}
            placeholder="Todos"
          />
        </Campo>
        <Campo etiqueta="Producto">
          <Selector
            valor={filtroProducto}
            onChange={(v) => {
              setFiltroProducto(v);
              setFiltroTipo('');
            }}
            opciones={(catalogo ?? []).map((p) => ({
              valor: String(p.idProducto),
              texto: p.nombre,
            }))}
            placeholder="Todos"
          />
        </Campo>
        {(filtroTipo || filtroProducto) && (
          <button
            className="btn btn--fantasma btn--fantasma-oscuro"
            onClick={() => {
              setFiltroTipo('');
              setFiltroProducto('');
            }}
          >
            Quitar filtros
          </button>
        )}
      </div>

      {cargando && <Cargando texto="Cargando movimientos" />}
      {error && <ErrorVista mensaje={error} onReintentar={recargar} />}

      {!cargando && !error && lista.length === 0 && (
        <Vacio
          titulo="Sin movimientos"
          descripcion="Registra una entrada cuando llegue mercancía del proveedor."
          accion={
            <button className="btn btn--principal" onClick={() => setRegistrando('entrada')}>
              Registrar entrada
            </button>
          }
        />
      )}

      {!cargando && !error && lista.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Movimiento</th>
                <th>Producto</th>
                <th className="alinea-derecha">Cantidad</th>
                <th>Motivo</th>
                <th>Proveedor</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {[...lista]
                .sort((a, b) => b.idMovimiento - a.idMovimiento)
                .map((m) => (
                  <tr key={m.idMovimiento}>
                    <td className="celda-id">#{m.idMovimiento}</td>
                    <td>{m.producto?.nombre ?? 'Producto eliminado'}</td>
                    <td className="alinea-derecha">
                      <span className={`marca-mov marca-mov--${m.tipo.toLowerCase()}`}>
                        {m.tipo === 'ENTRADA' ? `+${m.cantidad}` : `−${m.cantidad}`}
                      </span>
                    </td>
                    <td className="celda-motivo">{m.motivo}</td>
                    <td>{m.proveedor?.nombre ?? <span className="texto-apagado">—</span>}</td>
                    <td>{fechaHora(m.fecha)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {registrando && (
        <FormularioMovimiento
          modo={registrando}
          productos={catalogo ?? []}
          proveedores={listaProveedores ?? []}
          onCerrar={() => setRegistrando(null)}
          onGuardado={() => {
            setRegistrando(null);
            recargar();
            recargarCatalogo();
          }}
        />
      )}
    </>
  );
}

function FormularioMovimiento({ modo, productos, proveedores, onCerrar, onGuardado }) {
  const toast = useToast();
  const info = TIPOS_REGISTRO.find((t) => t.clave === modo);
  const [idProducto, setIdProducto] = useState('');
  const [idProveedor, setIdProveedor] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  const producto = productos.find((p) => String(p.idProducto) === String(idProducto));
  const excede = modo === 'salida' && producto && Number(cantidad) > producto.stock;

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const cuerpo = {
      idProducto: Number(idProducto),
      cantidad: Number(cantidad),
      motivo: motivo.trim() || info.titulo,
    };
    try {
      if (modo === 'entrada') {
        await api.registrarEntrada({ ...cuerpo, idProveedor: Number(idProveedor) });
      } else if (modo === 'salida') {
        await api.registrarSalida(cuerpo);
      } else {
        await api.registrarReversion(cuerpo);
      }
      toast.exito(`${info.titulo} registrada sobre ${producto?.nombre ?? 'el producto'}`);
      onGuardado();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={`Registrar ${info.titulo.toLowerCase()}`} descripcion={info.descripcion} onCerrar={onCerrar}>
      <form onSubmit={guardar}>
        <Campo
          etiqueta="Producto"
          ayuda={producto ? `Ahora mismo hay ${producto.stock} unidades en bodega.` : undefined}
        >
          <Selector
            valor={idProducto}
            onChange={setIdProducto}
            opciones={productos.map((p) => ({ valor: String(p.idProducto), texto: p.nombre }))}
            placeholder="Elige un producto"
            required
          />
        </Campo>

        {modo === 'entrada' && (
          <Campo
            etiqueta="Proveedor"
            ayuda={
              proveedores.length === 0 ? 'Primero registra un proveedor en su sección.' : undefined
            }
          >
            <Selector
              valor={idProveedor}
              onChange={setIdProveedor}
              opciones={proveedores.map((p) => ({ valor: String(p.idProveedor), texto: p.nombre }))}
              placeholder="Elige un proveedor"
              required
            />
          </Campo>
        )}

        <Campo etiqueta="Cantidad">
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className={excede ? 'es-invalido' : ''}
            required
          />
        </Campo>
        {excede && (
          <p className="error-linea">Solo hay {producto.stock} unidades disponibles.</p>
        )}

        <Campo etiqueta="Motivo" ayuda="Queda guardado en el histórico. Sé concreto.">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={
              modo === 'entrada'
                ? 'Compra semanal'
                : modo === 'salida'
                ? 'Merma por daño'
                : 'Corrección de salida mal registrada'
            }
          />
        </Campo>

        <div className="acciones-form">
          <button type="button" className="btn btn--contorno" onClick={onCerrar}>
            Volver
          </button>
          <button className="btn btn--principal" disabled={guardando || excede}>
            {guardando ? 'Guardando' : `Registrar ${info.titulo.toLowerCase()}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
