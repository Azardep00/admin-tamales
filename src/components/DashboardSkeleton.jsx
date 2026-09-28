// Imita la estructura del Dashboard (recorrido de pedidos, cifras, graficas
// y listas) usando las mismas clases, para que al llegar los datos el
// contenido reemplace a los bloques grises sin que nada salte de sitio.
export default function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando el resumen">
      <section className="tablero">
        <span className="esqueleto esqueleto--linea" style={{ width: 140, marginBottom: 18 }} />
        <ol className="flujo">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="flujo__etapa">
              <span className="esqueleto esqueleto--circulo" />
              <span className="esqueleto esqueleto--linea" style={{ width: 70 }} />
            </li>
          ))}
        </ol>
      </section>

      <section className="cifras">
        {[1, 2, 3, 4].map((i) => (
          <article key={i} className="cifra">
            <span className="esqueleto esqueleto--cifra" />
            <span className="esqueleto esqueleto--linea" style={{ width: '85%' }} />
          </article>
        ))}
      </section>

      <div className="rejilla-dos">
        {[1, 2].map((i) => (
          <section key={i} className="panel">
            <span className="esqueleto esqueleto--linea" style={{ width: 180, marginBottom: 16 }} />
            <span className="esqueleto esqueleto--grafica" />
          </section>
        ))}
      </div>

      <div className="rejilla-dos">
        {[1, 2].map((i) => (
          <section key={i} className="panel">
            <span className="esqueleto esqueleto--linea" style={{ width: 200, marginBottom: 16 }} />
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="esqueleto-fila">
                <span className="esqueleto esqueleto--linea" style={{ width: '45%' }} />
                <span className="esqueleto esqueleto--linea" style={{ width: '20%' }} />
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}