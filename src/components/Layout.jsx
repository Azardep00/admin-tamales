import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { integracion } from '../api';
import { useAuth } from '../context/contextos';

const SECCIONES = [
  { a: '/', texto: 'Resumen', fin: true },
  { a: '/pedidos', texto: 'Pedidos' },
  { a: '/productos', texto: 'Productos' },
  { a: '/inventario', texto: 'Inventario' },
  { a: '/proveedores', texto: 'Proveedores' },
  { a: '/usuarios', texto: 'Personas' },
];

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

export default function Layout() {
  const { sesion, salir } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

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
