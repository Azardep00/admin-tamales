import { useEffect, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:8080/api/pedidos';

// Colores por estado, para que la tabla sea legible de un vistazo
const COLOR_ESTADO = {
  PENDIENTE: '#f0ad4e',
  CONFIRMADO: '#5bc0de',
  EN_PREPARACION: '#0275d8',
  ENTREGADO: '#5cb85c',
  CANCELADO: '#d9534f',
};

// Solo estos avances son válidos según tu backend (PedidoService.siguienteEstado)
const SIGUIENTE_ESTADO = {
  PENDIENTE: 'CONFIRMADO',
  CONFIRMADO: 'EN_PREPARACION',
  EN_PREPARACION: 'ENTREGADO',
};

function App() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarPedidos = () => {
    setCargando(true);
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Error al consultar pedidos');
        return res.json();
      })
      .then((data) => {
        setPedidos(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const avanzarEstado = async (idPedido, estadoActual) => {
    const siguiente = SIGUIENTE_ESTADO[estadoActual];
    if (!siguiente) return;

    try {
      const res = await fetch(`${API_URL}/${idPedido}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: siguiente }),
      });
      if (!res.ok) throw new Error('No se pudo cambiar el estado');
      cargarPedidos();
    } catch (err) {
      alert(err.message);
    }
  };

  if (cargando) return <p style={{ padding: 20 }}>Cargando pedidos...</p>;
  if (error) return <p style={{ padding: 20, color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Pedidos — Distribuidora Tamales y Lechona</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #333' }}>
            <th style={{ padding: 8 }}>#</th>
            <th style={{ padding: 8 }}>Cliente</th>
            <th style={{ padding: 8 }}>Fecha</th>
            <th style={{ padding: 8 }}>Estado</th>
            <th style={{ padding: 8 }}>Total</th>
            <th style={{ padding: 8 }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.idPedido} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: 8 }}>{p.idPedido}</td>
              <td style={{ padding: 8 }}>
                {p.cliente?.nombre} {p.cliente?.apellido}
              </td>
              <td style={{ padding: 8 }}>{p.fecha?.replace('T', ' ').slice(0, 16)}</td>
              <td style={{ padding: 8 }}>
                <span
                  style={{
                    background: COLOR_ESTADO[p.estado] ?? '#999',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                >
                  {p.estado}
                </span>
              </td>
              <td style={{ padding: 8 }}>${Number(p.total).toLocaleString('es-CO')}</td>
              <td style={{ padding: 8 }}>
                {SIGUIENTE_ESTADO[p.estado] ? (
                  <button onClick={() => avanzarEstado(p.idPedido, p.estado)}>
                    Pasar a {SIGUIENTE_ESTADO[p.estado]}
                  </button>
                ) : (
                  <span style={{ color: '#999' }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pedidos.length === 0 && <p>No hay pedidos registrados todavía.</p>}
    </div>
  );
}

export default App;