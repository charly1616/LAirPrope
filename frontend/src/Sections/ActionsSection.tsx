import React, { useState, useEffect } from 'react';
import ActionCard from '../Components/ActionCard';
import SkeletonCard from '../Components/Skeletons/SkeletonCard.tsx';
import './ActionSection.css';

function ActionSection() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const api = "http://127.0.0.1:8000/api/1/actions/8";

  useEffect(() => {
    const fetchActions = async () => {
      try {
        setLoading(true);
        const response = await fetch(api);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setActions(data.actions || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching actions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, []);

  if (error) {
    return (
      <section className="action-section error">
        <div>Error al cargar las acciones: {error}</div>
      </section>
    );
  }

  return (
    <section className="action-section">
      <div className="container">
        <div className="header" style={{maxWidth: "800px"}}>
          <h2>Acciones Climáticas</h2>
          <p
            style={{
                lineHeight: "1.6",
                color: "#4a4a4a",
                fontSize: "1rem",
            }}
            >
            <span style={{ fontWeight: 500 }}>
                El planeta enfrenta cambios acelerados que afectan nuestra salud, nuestros recursos 
                y el futuro de las próximas generaciones.
            </span>

            <span style={{ opacity: 0.9 }}>
                Cada acción que emprendemos hoy puede marcar una diferencia real.
            </span>
            <br />

            <span style={{ fontWeight: 600 }}>
                Da el primer paso hacia un planeta más sano: descubre acciones simples pero poderosas 
                para reducir tu huella de carbono y convertirte en parte del cambio sostenible que el mundo necesita.
            </span>
            <br />
        </p>


        </div>

        <div className="grid">

          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : actions.map(([actionKey, actionData]) => (
                <ActionCard 
                  key={actionKey}
                  actionKey={actionKey}
                  actionData={actionData}
                />
              ))}

        </div>

        {!loading && actions.length === 0 && (
          <div className="no-actions">No se encontraron acciones climáticas disponibles.</div>
        )}
      </div>
    </section>
  );
}

export default ActionSection;
