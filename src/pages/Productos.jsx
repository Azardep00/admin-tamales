import { useState } from 'react';
import { productos as api } from '../api';
import { Encabezado } from '../components/Layout';
import {
  Campo,
  Cargando,
  Confirmar,
  ErrorVista,
  Fila,
  Modal,
  Pastilla,
  Selector,
  Vacio,
} from '../components/ui';
import { useToast } from '../context/contextos';
import {
  dinero,
  legible,
  STOCK_MINIMO,
  TAMANOS_LECHONA,
  TAMANOS_TAMAL,
  TIPOS_TAMAL,
} from '../lib/format';
import { useAsync, useDebounce } from '../lib/useAsync';

export default function Productos() {
  const toast = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [editando, setEditando] = useState(null);
  const [desactivando, setDesactivando] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const textoBuscado = useDebounce(busqueda);

  const { datos, cargando, error, recargar } = useAsync(
    () =>
      textoBuscado.trim()
        ? api.buscarPorNombre(textoBuscado.trim())
        : api.listar(incluirInactivos),
    [textoBuscado, incluirInactivos]
  );

  const desactivar = async () => {
    setTrabajando(true);
    try {
      await api.desactivar(desactivando.idProducto);
      toast.exito(`${desactivando.nombre} salió del catálogo`);
      setDesactivando(null);
      recargar();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTrabajando(false);
    }
  };

  const lista = datos ?? [];

  return (
    <>
      <Encabezado
        titulo="Productos"
        descripcion="Precio y descripción se editan aquí. El stock se mueve desde inventario."
        acciones={
          <button className="btn btn--principal" onClick={() => setEditando({ nuevo: true })}>
            Agregar producto
          </button>
        }
      />

      <div className="barra-filtros">
        <Campo etiqueta="Buscar por nombre">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="tamal, lechona…"
          />
        </Campo>
        <label className="interruptor">
          <input
            type="checkbox"
            checked={incluirInactivos}
            onChange={(e) => setIncluirInactivos(e.target.checked)}
            disabled={Boolean(textoBuscado.trim())}
          />
          <span>Mostrar también los retirados</span>
        </label>
      </div>

      {cargando && <Cargando texto="Cargando catálogo" />}
      {error && <ErrorVista mensaje={error} onReintentar={recargar} />}

      {!cargando && !error && lista.length === 0 && (
        <Vacio titulo="Sin productos" descripcion="No hay productos que coincidan con la búsqueda." />
      )}

      {!cargando && !error && lista.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th className="alinea-derecha">Precio</th>
                <th className="alinea-derecha">Stock</th>
                <th>Situación</th>
                <th className="alinea-derecha">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.idProducto} className={p.estado ? '' : 'fila-inactiva'}>
                  <td>
                    <span className="celda-principal">{p.nombre}</span>
                    <span className="celda-secundaria">{p.descripcion}</span>
                  </td>
                  <td>
                    <span className="celda-principal">{p.tipoProducto}</span>
                    <span className="celda-secundaria">
                      {p.tipoProducto === 'Tamal'
                        ? `${legible(p.tipo)}, ${legible(p.tamano)}`
                        : `${legible(p.tamano)}, ${p.numeroPorciones} porciones`}
                    </span>
                  </td>
                  <td className="alinea-derecha celda-numero">{dinero(p.precio)}</td>
                  <td className="alinea-derecha celda-numero">{p.stock}</td>
                  <td>
                    {!p.estado ? (
                      <Pastilla tono="cancelado">Retirado</Pastilla>
                    ) : p.stock === 0 ? (
                      <Pastilla tono="critico">Agotado</Pastilla>
                    ) : p.stock <= STOCK_MINIMO ? (
                      <Pastilla tono="pendiente">Stock bajo</Pastilla>
                    ) : (
                      <Pastilla tono="entregado">Disponible</Pastilla>
                    )}
                  </td>
                  <td className="alinea-derecha">
                    <div className="acciones-celda">
                      <button className="btn btn--pequeno btn--contorno" onClick={() => setEditando(p)}>
                        Editar
                      </button>
                      {p.estado && (
                        <button
                          className="btn btn--pequeno btn--fantasma btn--fantasma-oscuro"
                          onClick={() => setDesactivando(p)}
                        >
                          Retirar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <FormularioProducto
          producto={editando.nuevo ? null : editando}
          onCerrar={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            recargar();
          }}
        />
      )}

      {desactivando && (
        <Confirmar
          titulo={`Retirar ${desactivando.nombre}`}
          mensaje="Deja de aparecer en el catálogo y no se podrá pedir. El histórico de pedidos no cambia. Ten en cuenta que la API no tiene endpoint para volver a activarlo."
          textoAccion="Retirar del catálogo"
          trabajando={trabajando}
          onCerrar={() => setDesactivando(null)}
          onConfirmar={desactivar}
        />
      )}
    </>
  );
}

function FormularioProducto({ producto, onCerrar, onGuardado }) {
  const toast = useToast();
  const esNuevo = !producto;
  const [clase, setClase] = useState(producto?.tipoProducto ?? 'Tamal');
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? '',
    descripcion: producto?.descripcion ?? '',
    precio: producto?.precio ?? '',
    stock: producto?.stock ?? 0,
    tipo: producto?.tipo ?? 'NORMAL',
    tamano: producto?.tamano ?? (producto?.tipoProducto === 'Lechona' ? 'MEDIANA' : 'MEDIANO'),
    numeroPorciones: producto?.numeroPorciones ?? 12,
  });
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const cambiarClase = (nueva) => {
    setClase(nueva);
    setForm((f) => ({ ...f, tamano: nueva === 'Lechona' ? 'MEDIANA' : 'MEDIANO' }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);

    const base = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      stock: Number(form.stock),
      estado: true,
    };
    const cuerpo =
      clase === 'Tamal'
        ? { ...base, tipoProducto: 'Tamal', tipo: form.tipo, tamano: form.tamano }
        : {
            ...base,
            tipoProducto: 'Lechona',
            tamano: form.tamano,
            numeroPorciones: Number(form.numeroPorciones),
          };

    try {
      if (esNuevo) {
        if (clase === 'Tamal') await api.crearTamal(cuerpo);
        else await api.crearLechona(cuerpo);
        toast.exito(`${base.nombre} quedó en el catálogo`);
      } else {
        await api.actualizar(producto.idProducto, { ...cuerpo, stock: producto.stock });
        toast.exito(`${base.nombre} actualizado`);
      }
      onGuardado();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo={esNuevo ? 'Agregar producto' : `Editar ${producto.nombre}`}
      descripcion={
        esNuevo
          ? 'El stock inicial se registra aquí; los cambios posteriores van por inventario.'
          : 'El tipo de producto no se puede cambiar. Para eso hay que crear uno nuevo.'
      }
      onCerrar={onCerrar}
      ancho={560}
    >
      <form onSubmit={guardar}>
        {esNuevo && (
          <Campo etiqueta="Qué vas a agregar">
            <div className="segmentado">
              {['Tamal', 'Lechona'].map((op) => (
                <button
                  type="button"
                  key={op}
                  className={clase === op ? 'es-activo' : ''}
                  onClick={() => cambiarClase(op)}
                >
                  {op}
                </button>
              ))}
            </div>
          </Campo>
        )}

        <Campo etiqueta="Nombre">
          <input
            value={form.nombre}
            onChange={(e) => cambiar('nombre')(e.target.value)}
            required
            maxLength={80}
          />
        </Campo>

        <Campo etiqueta="Descripción">
          <textarea
            value={form.descripcion}
            onChange={(e) => cambiar('descripcion')(e.target.value)}
            rows={2}
          />
        </Campo>

        <Fila>
          <Campo etiqueta="Precio en pesos">
            <input
              type="number"
              min="1"
              step="500"
              value={form.precio}
              onChange={(e) => cambiar('precio')(e.target.value)}
              required
            />
          </Campo>
          <Campo
            etiqueta="Stock"
            ayuda={esNuevo ? 'Unidades con las que arranca' : 'Se ajusta desde inventario'}
          >
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => cambiar('stock')(e.target.value)}
              disabled={!esNuevo}
            />
          </Campo>
        </Fila>

        {clase === 'Tamal' ? (
          <Fila>
            <Campo etiqueta="Tipo">
              <Selector valor={form.tipo} onChange={cambiar('tipo')} opciones={TIPOS_TAMAL} />
            </Campo>
            <Campo etiqueta="Tamaño">
              <Selector valor={form.tamano} onChange={cambiar('tamano')} opciones={TAMANOS_TAMAL} />
            </Campo>
          </Fila>
        ) : (
          <Fila>
            <Campo etiqueta="Tamaño">
              <Selector valor={form.tamano} onChange={cambiar('tamano')} opciones={TAMANOS_LECHONA} />
            </Campo>
            <Campo etiqueta="Porciones">
              <input
                type="number"
                min="1"
                value={form.numeroPorciones}
                onChange={(e) => cambiar('numeroPorciones')(e.target.value)}
              />
            </Campo>
          </Fila>
        )}

        <div className="acciones-form">
          <button type="button" className="btn btn--contorno" onClick={onCerrar}>
            Volver
          </button>
          <button className="btn btn--principal" disabled={guardando}>
            {guardando ? 'Guardando' : esNuevo ? 'Agregar al catálogo' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
