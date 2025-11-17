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
      <p className="description">
        Este es un modelo que puedes usar para predecir CO₂ en el aire en los próximos X meses
      </p>
    </section>
  );
}