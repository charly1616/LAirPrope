import React, { useState, useEffect } from "react";
import "./DataSection.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


type SlidersComponentProps = {};

type ForecastApiResponse = {
  data: {
    dates: string[];
    predictions: number[];
    last_16_dates: string[];
    last_16_values: number[];
  };
};

type ChartPoint = {
  date: string;
  historical: number | null;
  forecast: number | null;
};

type Consequence = {
  description: string;
  impact_level: number;
  icon: string;
};

const API_BASE =
  "http://127.0.0.1:8000/api/1/forecast";

const DataSection: React.FC<SlidersComponentProps> = () => {
  const [months, setMonths] = useState<number>(1);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [consequences, setConsequences] = useState<Consequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonths(Number(e.target.value));
  };

  const getImpactColor = (level: number): string => {
    switch (level) {
      case 5:
        return "#eb3b5a"; 
      case 4:
        return "#f0ad4e"; 
      case 3:
        return "#ffd700"; 
      case 2:
        return "#5dde95"; 
      case 1:
        return "#2ed573"; 
      default:
        return "#gray";
    }
  };

  // Intervalo dinámico para el eje X: muestra como máximo ~12 ticks
  const xInterval = chartData.length > 12 ? Math.ceil(chartData.length / 12) : 0;

const REQUEST_TIMEOUT = 30000; 

const fetchForecast = async (months: number) => {
  if (months <= 0) {
    setChartData([]);
    return;
  }

  setLoading(true);
  setError(null);

  const url = `${API_BASE}/${months}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    console.log("[FETCH] Solicitando:", url);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let detailedMessage = "";
      try {
        const errJson = await response.json();
        detailedMessage = errJson?.message ?? "";
      } catch {}

      const message =
        detailedMessage ||
        `Error HTTP ${response.status}: ${response.statusText}`;

      console.error("[HTTP ERROR]", message);
      setError(message);
      return;
    }

    let json;
    try {
      json = await response.json();
    } catch (jsonErr) {
      console.error("[JSON ERROR]", jsonErr);
      setError("No se pudo leer la respuesta del servidor.");
      return;
    }

    if (
      !json?.data?.dates ||
      !json?.data?.predictions ||
      !json?.data?.last_16_dates ||
      !json?.data?.last_16_values
    ) {
      console.error("[DATA ERROR] Estructura inesperada:", json);
      setError("El servidor devolvió datos incompletos o inválidos.");
      return;
    }

    const { dates, predictions, last_16_dates, last_16_values } = json.data;

    const points: ChartPoint[] = [];

    last_16_dates.forEach((date: string, i: number) => {
      points.push({
        date,
        historical: last_16_values[i],
        forecast: null,
      });
    });

    dates.forEach((date: string, i: number) => {
      points.push({
        date,
        historical: null,
        forecast: predictions[i],
      });
    });

    setChartData(points);

    // Registro para depuración: ver estructura completa recibida
    console.debug("[FETCH] respuesta JSON:", json);

    // Si la API devuelve una lista de consecuencias, úsala
    // Aceptar varias posibles ubicaciones/nombres desde la API (case-insensitive)
    const getKeyCaseInsensitive = (obj: any, key: string) => {
      if (!obj || typeof obj !== "object") return undefined;
      const found = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase());
      return found ? (obj as any)[found] : undefined;
    };

    const candidates = [
      getKeyCaseInsensitive(json, "consequences"),
      getKeyCaseInsensitive(json?.data, "consequences"),
      getKeyCaseInsensitive(json, "impacts"),
      getKeyCaseInsensitive(json?.data, "impacts"),
    ];

    const rawConsequences = candidates.find((c) => Array.isArray(c)) || [];

    if (Array.isArray(rawConsequences) && rawConsequences.length > 0) {
      console.debug("[FETCH] consequences recibidas:", rawConsequences);
      // Normalizar campos para garantizar `description`, `impact_level`, `icon`
      const normalized = rawConsequences.map((c: any) => ({
        description: c.description || c.desc || c.text || "",
        impact_level: Number(c.impact_level ?? c.impactLevel ?? c.level ?? 0),
        icon: (c.icon || c.iconName || c.icon_class || "leaf").toString(),
      })) as Consequence[];
      setConsequences(normalized);
    } else {
      setConsequences([]);
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("[TIMEOUT] El servidor tardó demasiado.");
      setError("La solicitud tardó demasiado. Intenta nuevamente.");
    } else if (err instanceof TypeError) {
      console.error("[NETWORK ERROR]", err);
      setError(
        "No se pudo conectar con el servidor. Verifica tu conexión o si el túnel está activo."
      );
    } else {
      console.error("[UNKNOWN ERROR]", err);
      setError("Ocurrió un error inesperado al solicitar los datos.");
    }
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchForecast(months);
  }, [months]);

  // Las consecuencias las provee la API en la respuesta `json.data.consequences`.
  // Si no vienen, `consequences` quedará vacío.

  return (
    <div className="data-section">
      <h2 className="model-title">Elección de Meses a Proyectar</h2>
      <br />

      <p className="data-text">
        Ajusta el control para explorar diferentes escenarios de CO₂ en el
        tiempo.
      </p>

      <label className="data-label">
        Meses a evaluar:
        <input
          type="range"
          min={1}
          max={120}
          step={1}
          value={months}
          onChange={handleChange}
          className="data-slider"
        />
      </label>

      <div className="data-info-row">
        <span className="data-value">{months} meses</span>
      </div>

      <div className="data-chart-container">
        {loading && (
          <p className="data-loading">Cargando predicción...</p>
        )}

        <br />

        {error && <p className="data-error">{error}</p>}

        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
                data={chartData}
                width={chartData.length * 12}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => String(value).slice(0, 7)}
                angle={-45}
                textAnchor="end"
                height={70}
                interval={xInterval}
                minTickGap={8}
                allowDataOverflow={true}
                />

                <YAxis
                tick={{ fontSize: 10 }}
                label={{
                    value: "CO₂ (ppm)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11 },
                }}
                />

                <Tooltip />
                <Legend />

                <Line
                type="monotone"
                dataKey="historical"
                name="Histórico"
                stroke="#4b7bec"
                dot={false}
                />

                <Line
                type="monotone"
                dataKey="forecast"
                name="Predicción"
                stroke="#eb3b5a"
                dot={false}
                />
            </LineChart>
            </ResponsiveContainer>
                
        )}
      </div>

      <div className="consequences-section">
        <h3 className="consequences-title">Consecuencias del Incremento de CO₂</h3>
        {consequences.length > 0 && (
          <p style={{ textAlign: 'center', color: '#444', marginTop: 6 }}>
            Mostrando {consequences.length} consecuencias
          </p>
        )}
        <div className="consequences-list">
          {consequences.length === 0 ? (
            <p style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center' }}>
              No hay consecuencias disponibles.
            </p>
          ) : (
            consequences.map((consequence, index) => (
            <div
              key={index}
              className="consequence-item"
              style={{ borderLeftColor: getImpactColor(consequence.impact_level) }}
            >
              <div
                className="consequence-indicator"
                style={{ backgroundColor: getImpactColor(consequence.impact_level) }}
              />
              <i className={`fas fa-${consequence.icon} consequence-icon`}></i>
              <p className="consequence-description">{consequence.description}</p>
              <span className="consequence-level">
                Impacto: {consequence.impact_level}/5
              </span>
            </div>
          ))) }
        </div>
      </div>
    </div>
  );
};

export default DataSection;
