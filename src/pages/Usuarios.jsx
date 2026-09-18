import { useState } from 'react';
import { usuarios as api } from '../api';
import { Encabezado } from '../components/Layout';
import { Campo, Cargando, Confirmar, ErrorVista, Fila, Modal, Pastilla, Selector, Vacio } from '../components/ui';
import { useAuth, useToast } from '../context/contextos';
import { fecha, legible, nombreCompleto, TIPOS_CLIENTE } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export default function Usuarios() {
  const toast = useToast();
  const { sesion } = useAuth();
  const [pestana, setPestana] = useState('Cliente');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [editando, setEditando] = useState(null);
  const [cambiandoClave, setCambiandoClave] = useState(null);
  const [desactivando, setDesactivando] = useState(null);
  const [trabajando, setTrabajando] = useState(false);

  const { datos, cargando, error, recargar } = useAsync(
    () => api.listar(incluirInactivos),
    [incluirInactivos]
  );

  const lista = (datos ?? []).filter((u) => u.tipoUsuario === pestana);

  const desactivar = async () => {
    setTrabajando(true);
    try {
      await api.desactivar(desactivando.idUsuario);
      toast.exito(`${nombreCompleto(desactivando)} quedó inactivo`);
      setDesactivando(null);
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
        titulo="Personas"
        descripcion="Los clientes hacen pedidos; los empleados entran a este panel."
        acciones={
          <button
            className="btn btn--principal"
            onClick={() => setEditando({ nuevo: true, tipoUsuario: pestana })}
          >
            {pestana === 'Cliente' ? 'Agregar cliente' : 'Agregar empleado'}
          </button>
        }
      />

      <div className="barra-filtros">
        <div className="segmentado">
          {['Cliente', 'Empleado'].map((t) => (
            <button key={t} className={pestana === t ? 'es-activo' : ''} onClick={() => setPestana(t)}>
              {t === 'Cliente' ? 'Clientes' : 'Empleados'}
            </button>
          ))}
        </div>
        <label className="interruptor">
          <input
            type="checkbox"
            checked={incluirInactivos}
            onChange={(e) => setIncluirInactivos(e.target.checked)}
          />
          <span>Mostrar también los inactivos</span>
        </label>
      </div>

      {cargando && <Cargando texto="Cargando personas" />}
      {error && <ErrorVista mensaje={error} onReintentar={recargar} />}

      {!cargando && !error && lista.length === 0 && (
        <Vacio
          titulo={pestana === 'Cliente' ? 'Sin clientes' : 'Sin empleados'}
          descripcion="Agrega el primero para empezar."
        />
      )}

      {!cargando && !error && lista.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Contacto</th>
                {pestana === 'Cliente' ? (
                  <>
                    <th>Categoría</th>
                    <th>Dirección</th>
                    <th>Cliente desde</th>
                  </>
                ) : (
                  <>
                    <th>Cargo</th>
                    <th>Contratado</th>
                    <th>Situación</th>
                  </>
                )}
                <th className="alinea-derecha">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.idUsuario} className={u.estado ? '' : 'fila-inactiva'}>
                  <td>
                    <span className="celda-principal">
                      {nombreCompleto(u)}
                      {u.idUsuario === sesion?.idUsuario && (
                        <span className="marca-tu"> tú</span>
                      )}
                    </span>
                    <span className="celda-secundaria">Nació el {fecha(u.fechaNacimiento)}</span>
                  </td>
                  <td>
                    <span className="celda-principal">{u.correo}</span>
                    <span className="celda-secundaria">{u.telefono}</span>
                  </td>
                  {pestana === 'Cliente' ? (
                    <>
                      <td>
                        <Pastilla tono={u.tipoCliente === 'PREMIUM' ? 'confirmado' : 'neutra'}>
                          {legible(u.tipoCliente)}
                        </Pastilla>
                      </td>
                      <td>{u.direccion || <span className="texto-apagado">—</span>}</td>
                      <td>{fecha(u.fechaRegistro)}</td>
                    </>
                  ) : (
                    <>
                      <td>{u.cargo}</td>
                      <td>{fecha(u.fechaContratacion)}</td>
                      <td>
                        {u.estado ? (
                          <Pastilla tono="entregado">Activo</Pastilla>
                        ) : (
                          <Pastilla tono="cancelado">Inactivo</Pastilla>
                        )}
                      </td>
                    </>
                  )}
                  <td className="alinea-derecha">
                    <div className="acciones-celda">
                      <button className="btn btn--pequeno btn--contorno" onClick={() => setEditando(u)}>
                        Editar
                      </button>
                      <button
                        className="btn btn--pequeno btn--fantasma btn--fantasma-oscuro"
                        onClick={() => setCambiandoClave(u)}
                      >
                        Contraseña
                      </button>
                      {u.estado && u.idUsuario !== sesion?.idUsuario && (
                        <button
                          className="btn btn--pequeno btn--fantasma btn--fantasma-oscuro"
                          onClick={() => setDesactivando(u)}
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
        <FormularioUsuario
          usuario={editando.nuevo ? null : editando}
          tipo={editando.nuevo ? editando.tipoUsuario : editando.tipoUsuario}
          onCerrar={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            recargar();
          }}
        />
      )}

      {cambiandoClave && (
        <FormularioClave usuario={cambiandoClave} onCerrar={() => setCambiandoClave(null)} />
      )}

      {desactivando && (
        <Confirmar
          titulo={`Desactivar a ${nombreCompleto(desactivando)}`}
          mensaje="No podrá iniciar sesión ni recibir pedidos nuevos. Su histórico se conserva."
          textoAccion="Desactivar"
          trabajando={trabajando}
          onCerrar={() => setDesactivando(null)}
          onConfirmar={desactivar}
        />
      )}
    </>
  );
}

function FormularioUsuario({ usuario, tipo, onCerrar, onGuardado }) {
  const toast = useToast();
  const esNuevo = !usuario;
  const esCliente = tipo === 'Cliente';
  const hoy = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? '',
    apellido: usuario?.apellido ?? '',
    telefono: usuario?.telefono ?? '',
    correo: usuario?.correo ?? '',
    contrasena: '',
    fechaNacimiento: usuario?.fechaNacimiento ?? '',
    tipoCliente: usuario?.tipoCliente ?? 'NUEVO',
    direccion: usuario?.direccion ?? '',
    fechaRegistro: usuario?.fechaRegistro ?? hoy,
    cargo: usuario?.cargo ?? '',
    fechaContratacion: usuario?.fechaContratacion ?? hoy,
  });
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target?.value !== undefined ? e.target.value : e }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);

    const base = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      telefono: form.telefono.trim(),
      correo: form.correo.trim(),
      fechaNacimiento: form.fechaNacimiento || null,
      estado: true,
    };
    const especifico = esCliente
      ? {
          tipoCliente: form.tipoCliente,
          direccion: form.direccion.trim(),
          fechaRegistro: form.fechaRegistro,
        }
      : { cargo: form.cargo.trim(), fechaContratacion: form.fechaContratacion };

    try {
      if (esNuevo) {
        const cuerpo = { ...base, ...especifico, contrasena: form.contrasena };
        if (esCliente) await api.crearCliente(cuerpo);
        else await api.crearEmpleado(cuerpo);
        toast.exito(`${base.nombre} quedó registrado`);
      } else {
        // El PUT nunca toca la contraseña: para eso está el endpoint dedicado.
        await api.actualizar(usuario.idUsuario, {
          tipoUsuario: tipo,
          ...base,
          ...especifico,
        });
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
      titulo={
        esNuevo
          ? esCliente
            ? 'Agregar cliente'
            : 'Agregar empleado'
          : `Editar a ${nombreCompleto(usuario)}`
      }
      descripcion={esNuevo ? undefined : 'La contraseña se cambia desde su propio botón.'}
      onCerrar={onCerrar}
      ancho={560}
    >
      <form onSubmit={guardar}>
        <Fila>
          <Campo etiqueta="Nombre">
            <input value={form.nombre} onChange={cambiar('nombre')} required />
          </Campo>
          <Campo etiqueta="Apellido">
            <input value={form.apellido} onChange={cambiar('apellido')} required />
          </Campo>
        </Fila>

        <Fila>
          <Campo etiqueta="Teléfono">
            <input value={form.telefono} onChange={cambiar('telefono')} required />
          </Campo>
          <Campo etiqueta="Correo">
            <input type="email" value={form.correo} onChange={cambiar('correo')} required />
          </Campo>
        </Fila>

        <Fila>
          <Campo etiqueta="Fecha de nacimiento">
            <input type="date" value={form.fechaNacimiento ?? ''} onChange={cambiar('fechaNacimiento')} />
          </Campo>
          {esNuevo && (
            <Campo etiqueta="Contraseña" ayuda="Mínimo 6 caracteres">
              <input
                type="password"
                value={form.contrasena}
                onChange={cambiar('contrasena')}
                minLength={6}
                required
              />
            </Campo>
          )}
        </Fila>

        {esCliente ? (
          <>
            <Fila>
              <Campo etiqueta="Categoría">
                <Selector
                  valor={form.tipoCliente}
                  onChange={(v) => setForm((f) => ({ ...f, tipoCliente: v }))}
                  opciones={TIPOS_CLIENTE}
                />
              </Campo>
              <Campo etiqueta="Cliente desde">
                <input type="date" value={form.fechaRegistro ?? ''} onChange={cambiar('fechaRegistro')} />
              </Campo>
            </Fila>
            <Campo etiqueta="Dirección de entrega">
              <input value={form.direccion} onChange={cambiar('direccion')} />
            </Campo>
          </>
        ) : (
          <Fila>
            <Campo etiqueta="Cargo">
              <input value={form.cargo} onChange={cambiar('cargo')} required />
            </Campo>
            <Campo etiqueta="Fecha de contratación">
              <input
                type="date"
                value={form.fechaContratacion ?? ''}
                onChange={cambiar('fechaContratacion')}
              />
            </Campo>
          </Fila>
        )}

        <div className="acciones-form">
          <button type="button" className="btn btn--contorno" onClick={onCerrar}>
            Volver
          </button>
          <button className="btn btn--principal" disabled={guardando}>
            {guardando ? 'Guardando' : esNuevo ? 'Agregar' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FormularioClave({ usuario, onCerrar }) {
  const toast = useToast();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    if (nueva !== repetida) return toast.error('La confirmación no coincide con la nueva contraseña.');
    setGuardando(true);
    try {
      await api.cambiarContrasena(usuario.idUsuario, actual, nueva);
      toast.exito('Contraseña actualizada');
      onCerrar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo="Cambiar contraseña"
      descripcion={`Para ${nombreCompleto(usuario)}. Hay que conocer la contraseña actual.`}
      onCerrar={onCerrar}
      ancho={440}
    >
      <form onSubmit={guardar}>
        <Campo etiqueta="Contraseña actual">
          <input type="password" value={actual} onChange={(e) => setActual(e.target.value)} required />
        </Campo>
        <Campo etiqueta="Nueva contraseña" ayuda="Mínimo 6 caracteres">
          <input
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            minLength={6}
            required
          />
        </Campo>
        <Campo etiqueta="Repite la nueva contraseña">
          <input
            type="password"
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
            minLength={6}
            required
          />
        </Campo>
        <div className="acciones-form">
          <button type="button" className="btn btn--contorno" onClick={onCerrar}>
            Volver
          </button>
          <button className="btn btn--principal" disabled={guardando}>
            {guardando ? 'Guardando' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
