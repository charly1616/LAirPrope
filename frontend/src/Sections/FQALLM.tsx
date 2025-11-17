import React, { useState } from 'react';
import './FaqStyles.css';

// --- Componente para un solo item de FAQ ---
const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
        <span>{question}</span>
        <span className={`faq-icon ${isOpen ? 'open' : ''}`}>{isOpen ? '-' : '+'}</span>
      </button>
      {isOpen && (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

// --- Componente para la sección de "Pregunta al LLM" ---
const AskLLM = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Por favor, introduce una pregunta.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResponse('');

    // **Simulación de llamada a la API de Gemini Flash 2.5**
    // En una aplicación real, aquí harías la petición a tu backend que a su vez llama al LLM.
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simula el tiempo de respuesta
      setResponse(`Respuesta simulada de Gemini a: "${prompt}". En un entorno de producción, esta sería la respuesta real del modelo de lenguaje, procesada y mostrada de forma clara y concisa para el usuario.`);
    } catch (apiError) {
      setError('Lo sentimos, ha ocurrido un error al procesar tu pregunta.');
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };

  return (
    <div className="ask-llm-card">
      <h3>¿Tienes otra pregunta?</h3>
      <p>Pregúntale directamente a nuestro asistente de IA.</p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escribe tu pregunta aquí..."
          className="llm-input"
          rows="3"
        />
        <button type="submit" className="llm-submit-btn" disabled={isLoading}>
          {isLoading ? 'Pensando...' : 'Enviar Pregunta'}
        </button>
      </form>
      {error && <p className="llm-error">{error}</p>}
      {response && (
        <div className="llm-response">
          <h4>Respuesta:</h4>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};


// --- FQL Principal de la Sección de FAQ ---
const FQALLMM = () => {
  const faqData = [
  {
    question: "¿Qué datos utiliza el sistema para predecir los niveles de CO₂?",
    answer: "El sistema usa datos históricos de concentración atmosférica de CO₂ medidos mensualmente. Estos datos se procesan y normalizan para que el modelo LSTM pueda aprender patrones de tendencia y estacionalidad."
  },
  {
    question: "¿Cómo funciona el modelo LSTM que realiza las predicciones?",
    answer: "El modelo LSTM analiza secuencias temporales de varios meses y aprende dependencias a largo plazo para estimar el valor futuro del CO₂. Esta arquitectura es ideal para series de tiempo con patrones complejos."
  },
  {
    question: "¿Cada cuánto tiempo se actualizan las predicciones de CO₂?",
    answer: "Las predicciones pueden regenerarse automáticamente cada vez que se cargan datos nuevos en la API. La frecuencia depende de cómo esté configurado el backend."
  },
  {
    question: "¿Qué tan preciso es el modelo de predicción?",
    answer: "El modelo ha sido evaluado con métricas como RMSE y MSE, logrando un error promedio menor a 1 ppm, lo que indica que sigue adecuadamente la tendencia real del CO₂."
  },
  {
    question: "¿Qué tecnología utiliza el backend del proyecto?",
    answer: "El backend expone endpoints REST, generalmente implementados con Python y frameworks como FastAPI o Django, que procesan datos, ejecutan el modelo y devuelven predicciones."
  },
  {
    question: "¿Cómo se visualizan los datos de CO₂ en la interfaz?",
    answer: "La interfaz usa componentes de React que muestran gráficos interactivos, tarjetas explicativas y secciones que detallan las acciones climáticas y la arquitectura del modelo."
  },
  {
    question: "¿Cómo se manejan los estados de carga y error en la aplicación?",
    answer: "La app muestra estados visuales como skeletons, mensajes de error y pantallas de carga mientras se consultan los datos desde la API para mejorar la experiencia del usuario."
  },
  {
    question: "¿Qué impacto tienen las acciones climáticas recomendadas?",
    answer: "Cada acción está vinculada a una reducción potencial de emisiones, explicando cómo contribuye a disminuir la huella de carbono del usuario y por qué es efectiva."
  },
  {
    question: "¿Se pueden agregar nuevas acciones climáticas al sistema?",
    answer: "Sí, el backend está preparado para recibir nuevas acciones mediante el panel o la API, y el frontend las renderiza dinámicamente sin necesidad de modificar el código."
  },
  {
    question: "¿Qué limitaciones tiene el modelo de predicción de CO₂?",
    answer: "El modelo no considera eventos excepcionales como erupciones volcánicas o cambios drásticos en políticas ambientales. Además, a mayor horizonte de predicción, aumenta la incertidumbre."
  }
];


  return (
    <div className="faq-container" id='fqa'>
      <h2>Preguntas Frecuentes</h2>
      <div className="faq-list">
        {faqData
            .sort(() => Math.random() - 0.5)
            .slice(0, 4)
            .map((item, index) => (
            <FaqItem key={index} question={item.question} answer={item.answer} />
            ))}
        </div>
      <AskLLM />
    </div>
  );
};

export default FQALLMM;