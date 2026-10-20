import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { integracion, pedidos } from '../api';
import { useAuth, useToast } from '../context/contextos';

const SECCIONES = [
  { a: '/', texto: 'Resumen', fin: true },
  { a: '/pedidos', texto: 'Pedidos' },
  { a: '/productos', texto: 'Productos' },
  { a: '/inventario', texto: 'Inventario' },
  { a: '/proveedores', texto: 'Proveedores' },
  { a: '/usuarios', texto: 'Personas' },
];

// Cada cuanto se revisa si hay pedidos pendientes nuevos (en milisegundos).
const INTERVALO_POLLING = 20000;

function Clima() {
  const [clima, setClima] = useState(null);

  useEffect(() => {
    integracion
      .clima()
      .then(setClima)
      .catch(() => setClima(null));
  }, []);

  if (!clima?.current_weather) return null;
  return (
    <span className="clima" title="Clima actual en Ibagué (servicio Open-Meteo)">
      {Math.round(clima.current_weather.temperature)}°C en Ibagué
    </span>
  );
}

// --------------------------------------------------------------
// Hook: useAvisoPedidosNuevos
// Revisa cada INTERVALO_POLLING cuantos pedidos PENDIENTE hay.
// Si el numero sube respecto a la ultima revision, dispara un
// toast de exito avisando cuantos pedidos nuevos llegaron.
// No se ejecuta si no hay sesion iniciada (evita llamadas de mas
// en la pantalla de login).
// --------------------------------------------------------------
function useAvisoPedidosNuevos(sesion) {
  const toast = useToast();
  const vistos = useRef(null); // ids de pedidos CONFIRMADO ya conocidos

  useEffect(() => {
    if (!sesion) return;

    const revisar = async () => {
      try {
        const confirmados = await pedidos.listar({ estado: 'CONFIRMADO' });
        const ids = new Set(confirmados.map((p) => p.idPedido));

        if (vistos.current === null) {
          vistos.current = ids; // primera vuelta: solo referencia
          return;
        }

        const nuevos = [...ids].filter((id) => !vistos.current.has(id));
        if (nuevos.length > 0) {
          toast.exito(
            nuevos.length === 1
              ? '¡Llegó 1 pedido pagado!'
              : `¡Llegaron ${nuevos.length} pedidos pagados!`
          );
          window.dispatchEvent(new CustomEvent('pedidos:nuevo'));
        }
        vistos.current = new Set([...vistos.current, ...ids]);
      } catch (e) {
        console.warn('Revisión de pedidos falló:', e.message);
      }
    };

    revisar();
    const intervalo = setInterval(revisar, 20000);
    return () => clearInterval(intervalo);
  }, [sesion, toast]);
}

export default function Layout() {
  const { sesion, salir } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useAvisoPedidosNuevos(sesion);

  return (
    <div className="marco">
      <aside className={`lateral ${menuAbierto ? 'lateral--abierto' : ''}`}>
        <div className="marca">
          <span className="marca__nombre">Tamales y Lechona</span>
          <span className="marca__linea">Panel de operación</span>
        </div>

        <nav className="navegacion">
          {SECCIONES.map((s) => (
            <NavLink
              key={s.a}
              to={s.a}
              end={s.fin}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) => `navegacion__enlace ${isActive ? 'es-activo' : ''}`}
            >
              {s.texto}
            </NavLink>
          ))}
        </nav>

        <div className="lateral__pie">
          <p className="lateral__usuario">
            {sesion?.nombre} {sesion?.apellido}
          </p>
          <p className="lateral__correo">{sesion?.correo}</p>
          <button className="btn btn--fantasma" onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="contenido">
        <header className="encabezado">
          <button
            className="btn-icono btn-icono--menu"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Abrir menú"
          >
            ≡
          </button>
          <Clima />
        </header>
        <main className="principal">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function Encabezado({ titulo, descripcion, acciones }) {
  return (
    <div className="titulo-pagina">
      <div>
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {acciones && <div className="titulo-pagina__acciones">{acciones}</div>}
    </div>
  );
}