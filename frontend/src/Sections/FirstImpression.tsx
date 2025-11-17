import React from "react";
import "./FirstImpression.css";

export default function FirstImpression() {
  return (
    <section className="first-impression">
      <img
        className="hero-image"
        src="/ClimatePanorama.jpeg"
        alt="Flat illustration panorama"
      />
      <p style={{
                lineHeight: "1.6",
                color: "#4a4a4a",
                fontSize: "1rem",
                textWrap: "pretty",
                maxWidth: "800px",
                padding: "0 20px",
            }}>
        Mira cómo podrían evolucionar los niveles de CO₂ en los próximos meses. Esta herramienta combina datos reales y un modelo avanzado de predicción para mostrarte el futuro de la atmósfera, explicar sus posibles consecuencias y ofrecerte acciones simples para generar un impacto positivo. Descubre qué podría pasar… y cómo puedes ayudar a cambiarlo.
      </p>

    </section>
  );
}