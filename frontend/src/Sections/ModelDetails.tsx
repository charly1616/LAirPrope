import "./ModelDetails.css";

function ModelDetails() {
  return (
    <section className="model-section">
      <div className="model-container">

        <h2 className="model-title">Detalles del Modelo de Predicción de CO₂</h2>
        <br />

        <p>
          Para predecir la concentración futura de CO₂ atmosférico (en ppm), se empleó un
          modelo de <strong>red neuronal recurrente (RNN)</strong> basado en
          <strong> Long Short-Term Memory (LSTM)</strong>, una arquitectura especializada
          para capturar patrones temporales complejos y dependencias de largo plazo en
          series de tiempo.
        </p>

        <h3>Datos utilizados</h3>
        <p>
          El modelo fue entrenado con datos históricos de CO₂ atmosférico, procesados en
          intervalos regulares. Se aplicó:
        </p>

        <ul>
          <li>Normalización Min-Max para mejorar la estabilidad del entrenamiento.</li>
          <li>Ventanas deslizantes para crear secuencias de entrada.</li>
          <li>División temporal: 80% entrenamiento, 20% validación.</li>
        </ul>

        <h3>Arquitectura del modelo</h3>
        <p>La arquitectura permite aprender patrones estacionales y tendencias:</p>

        <ul>
          <li>Capa LSTM multivariada de <strong>96 → 64 unidades</strong>.</li>
          <li>Capa densa de <strong>32 neuronas</strong> con ReLU.</li>
          <li>Salida final de <strong>1 neurona</strong>.</li>
        </ul>

        <img
          src="/Model_Architecture.png"
          alt="Arquitectura del modelo"
          className="model-image"
          style={{maxWidth:"500px"}}
        />

        <h3>Entrenamiento</h3>
        <p>
          Entrenado con <strong>Adam</strong> y pérdida <strong>MSE</strong>, logrando 
          identificar patrones no lineales y estacionales.
        </p>

        <img
          src="/Graph_Training.png"
          alt="Gráfica de entrenamiento"
          className="model-image"
        />

        <h3>Métricas de desempeño</h3>
        <ul>
          <li><strong>Train RMSE:</strong> 0.71 ppm</li>
          <li><strong>Test RMSE:</strong> 0.84 ppm</li>
        </ul>

        <p>
          Estos valores muestran que el modelo generaliza adecuadamente y sigue la dinámica 
          real del CO₂ incluso en intervalos no vistos.
        </p>

        <h3>5. Validación y comportamiento</h3>
        <p>
          El modelo sigue de forma coherente la tendencia global, con buena capacidad de 
          extrapolación de patrones.
        </p>

        <h3>Limitaciones</h3>
        <ul>
          <li>No incluye factores externos como volcanes o políticas climáticas.</li>
          <li>Mayor incertidumbre en horizontes de predicción largos.</li>
          <li>Dependencia total de la calidad de los datos históricos.</li>
        </ul>

        <h3>Aporte del modelo</h3>
        <p>
          Permite visualizar escenarios futuros de CO₂, comprender tendencias y apoyar
          decisiones informadas frente al cambio climático.
        </p>

      </div>
    </section>
  );
}

export default ModelDetails;
