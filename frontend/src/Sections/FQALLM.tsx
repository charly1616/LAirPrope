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

// --- Componente para el formulario de contacto por correo ---
const ContactForm = () => {
  const [formData, setFormData] = useState({
    subject: '',
    userEmail: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validaciones
    if (!formData.subject.trim()) {
      setError('Por favor, introduce un asunto.');
      return;
    }
    if (!formData.userEmail.trim()) {
      setError('Por favor, introduce tu correo electrónico.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      setError('Por favor, introduce un correo válido.');
      return;
    }
    if (!formData.message.trim()) {
      setError('Por favor, escribe un mensaje.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Enviar correo al backend
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'dummycharlyb@gmail.com',
          subject: formData.subject,
          userEmail: formData.userEmail,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData?.message || 'Error al enviar el correo.');
        return;
      }

      setSuccess(true);
      setFormData({ subject: '', userEmail: '', message: '' });
      setTimeout(() => setSuccess(false), 5000); // Ocultar mensaje de éxito después de 5s
    } catch (apiError) {
      console.error('[EMAIL ERROR]', apiError);
      setError('No se pudo enviar el correo. Intenta más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ask-llm-card">
      <h3>¿Tienes una pregunta o sugerencia?</h3>
      <p>Envíanos un mensaje y nos pondremos en contacto pronto.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="subject">Asunto:</label>
          <input
            id="subject"
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Ej: Pregunta sobre CO₂"
            className="llm-input"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="userEmail">Tu correo:</label>
          <input
            id="userEmail"
            type="email"
            name="userEmail"
            value={formData.userEmail}
            onChange={handleChange}
            placeholder="tu@correo.com"
            className="llm-input"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Mensaje:</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Escribe tu mensaje aquí..."
            className="llm-input"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <button type="submit" className="llm-submit-btn" disabled={isLoading}>
          {isLoading ? 'Enviando...' : 'Enviar Mensaje'}
        </button>
      </form>

      {error && <p className="llm-error">{error}</p>}
      {success && (
        <div className="llm-response">
          <h4>¡Mensaje enviado!</h4>
          <p>Gracias por tu mensaje. Nos pondremos en contacto pronto.</p>
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
      <ContactForm />
    </div>
  );
};

export default FQALLMM;