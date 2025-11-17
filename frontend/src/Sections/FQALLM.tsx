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
      question: '¿Qué es React y por qué es tan popular?',
      answer: 'React es una biblioteca de JavaScript para construir interfaces de usuario. Su popularidad se debe a su modelo de componentes reutilizables, el DOM virtual que optimiza el rendimiento y un ecosistema robusto mantenido por Facebook.',
    },
    {
      question: '¿Cuál es la diferencia entre una SPA y una aplicación web tradicional?',
      answer: 'Una Single Page Application (SPA) carga una única página HTML y luego actualiza dinámicamente el contenido. Esto proporciona una experiencia de usuario más fluida y rápida, similar a una aplicación de escritorio. Las aplicaciones tradicionales recargan la página completa con cada nueva solicitud.',
    },
    {
      question: '¿Qué son los hooks en React?',
      answer: 'Los hooks son funciones que te permiten "enganchar" el estado de React y las características del ciclo de vida desde componentes de función. El hook `useState` es para manejar el estado local, y `useEffect` es para realizar efectos secundarios.',
    },
     {
      question: '¿Es necesario utilizar CSS externo?',
      answer: 'Si bien existen soluciones de CSS-in-JS, el uso de archivos .CSS externos es una buena práctica para la separación de responsabilidades, el cacheo del navegador y la facilidad de mantenimiento, especialmente en proyectos grandes.',
    },
  ];

  return (
    <div className="faq-container">
      <h2>Preguntas Frecuentes</h2>
      <div className="faq-list">
        {faqData.map((item, index) => (
          <FaqItem key={index} question={item.question} answer={item.answer} />
        ))}
      </div>
      <AskLLM />
    </div>
  );
};

export default FQALLMM;