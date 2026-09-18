import { useState } from 'react';
import { proveedores as api } from '../api';
import { Encabezado } from '../components/Layout';
import { Campo, Cargando, Confirmar, ErrorVista, Fila, Modal, Pastilla, Vacio } from '../components/ui';
import { useToast } from '../context/contextos';
import { useAsync, useDebounce } from '../lib/useAsync';

export default function Proveedores() {
  const toast = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [editando, setEditando] = useState(null);
  const [desactivando, setDesactivando] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const textoBuscado = useDebounce(busqueda);

  const { datos, cargando, error, recargar } = useAsync(
    () => (textoBuscado.trim() ? api.buscar(textoBuscado.trim()) : api.listar(incluirInactivos)),
    [textoBuscado, incluirInactivos]
  );

  const desactivar = async () => {
    setTrabajando(true);
    try {
      await api.desactivar(desactivando.idProveedor);
      toast.exito(`${desactivando.nombre} quedó inactivo`);
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
        titulo="Proveedores"
        descripcion="A quién le compras. Toda entrada de inventario se asocia a uno."
        acciones={
          <button className="btn btn--principal" onClick={() => setEditando({ nuevo: true })}>
            Registrar proveedor
          </button>
        }
      />

      <div className="barra-filtros">
        <Campo etiqueta="Buscar por nombre, teléfono o correo">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Escribe para buscar"
          />
        </Campo>
        <label className="interruptor">
          <input
            type="checkbox"
            checked={incluirInactivos}
            onChange={(e) => setIncluirInactivos(e.target.checked)}
            disabled={Boolean(textoBuscado.trim())}
          />
          <span>Mostrar también los inactivos</span>
        </label>
      </div>

      {cargando && <Cargando texto="Cargando proveedores" />}
      {error && <ErrorVista mensaje={error} onReintentar={recargar} />}

      {!cargando && !error && lista.length === 0 && (
        <Vacio
          titulo="Sin proveedores"
          descripcion="Registra al menos uno para poder anotar las entradas de mercancía."
          accion={
            <button className="btn btn--principal" onClick={() => setEditando({ nuevo: true })}>
              Registrar proveedor
            </button>
          }
        />
      )}

      {!cargando && !error && lista.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Dirección</th>
                <th>Situación</th>
                <th className="alinea-derecha">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.idProveedor} className={p.estado ? '' : 'fila-inactiva'}>
                  <td className="celda-principal">{p.nombre}</td>
                  <td>{p.telefono}</td>
                  <td>{p.correo}</td>
                  <td>{p.direccion || <span className="texto-apagado">—</span>}</td>
                  <td>
                    {p.estado ? (
                      <Pastilla tono="entregado">Activo</Pastilla>
                    ) : (
                      <Pastilla tono="cancelado">Inactivo</Pastilla>
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
                          Desactivar
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
        <FormularioProveedor
          proveedor={editando.nuevo ? null : editando}
          onCerrar={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            recargar();
          }}
        />
      )}

      {desactivando && (
        <Confirmar
          titulo={`Desactivar ${desactivando.nombre}`}
          mensaje="Deja de aparecer al registrar entradas. Los movimientos que ya tiene asociados se conservan."
          textoAccion="Desactivar"
          trabajando={trabajando}
          onCerrar={() => setDesactivando(null)}
          onConfirmar={desactivar}
        />
      )}
    </>
  );
}

function FormularioProveedor({ proveedor, onCerrar, onGuardado }) {
  const toast = useToast();
  const esNuevo = !proveedor;
  const [form, setForm] = useState({
    nombre: proveedor?.nombre ?? '',
    telefono: proveedor?.telefono ?? '',
    correo: proveedor?.correo ?? '',
    direccion: proveedor?.direccion ?? '',
  });
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const cuerpo = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      correo: form.correo.trim(),
      direccion: form.direccion.trim(),
      estado: true,
    };
    try {
      if (esNuevo) {
        await api.registrar(cuerpo);
        toast.exito(`${cuerpo.nombre} quedó registrado`);
      } else {
        await api.actualizar(proveedor.idProveedor, cuerpo);
        toast.exito(`${cuerpo.nombre} actualizado`);
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
      titulo={esNuevo ? 'Registrar proveedor' : `Editar ${proveedor.nombre}`}
      onCerrar={onCerrar}
    >
      <form onSubmit={guardar}>
        <Campo etiqueta="Nombre o razón social">
          <input value={form.nombre} onChange={cambiar('nombre')} required />
        </Campo>
        <Fila>
          <Campo etiqueta="Teléfono">
            <input value={form.telefono} onChange={cambiar('telefono')} required />
          </Campo>
          <Campo etiqueta="Correo">
            <input type="email" value={form.correo} onChange={cambiar('correo')} required />
          </Campo>
        </Fila>
        <Campo etiqueta="Dirección">
          <input value={form.direccion} onChange={cambiar('direccion')} />
        </Campo>

        <div className="acciones-form">
          <button type="button" className="btn btn--contorno" onClick={onCerrar}>
            Volver
          </button>
          <button className="btn btn--principal" disabled={guardando}>
            {guardando ? 'Guardando' : esNuevo ? 'Registrar' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
