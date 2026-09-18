import { useState } from 'react';
import { useAuth } from '../context/contextos';

export default function Login() {
  const { entrar } = useAuth();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [entrando, setEntrando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEntrando(true);
    setError(null);
    try {
      await entrar(correo.trim(), contrasena);
    } catch (err) {
      setError(err.message);
    } finally {
      setEntrando(false);
    }
  };

  return (
    <div className="acceso">
      <div className="acceso__panel">
        <p className="acceso__marca">Distribuidora de Tamales y Lechona</p>
        <h1 className="acceso__titulo">
          Todo lo que sale de la cocina,
          <br />
          en una sola pantalla.
        </h1>
        <p className="acceso__nota">
          Pedidos, inventario, proveedores y clientes. Entra con tu cuenta de empleado.
        </p>
      </div>

      <form className="acceso__form" onSubmit={enviar}>
        <h2>Entrar al panel</h2>

        <label className="campo">
          <span className="campo__etiqueta">Correo</span>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="carlos@example.com"
            required
            autoComplete="username"
          />
        </label>

        <label className="campo">
          <span className="campo__etiqueta">Contraseña</span>
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {error && <p className="error-linea">{error}</p>}

        <button className="btn btn--principal btn--bloque" disabled={entrando}>
          {entrando ? 'Verificando' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
