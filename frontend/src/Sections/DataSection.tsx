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
import dataSample from "../assets/data_sample.json";

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
  "https://wmsxzg35-8000.use2.devtunnels.ms/api/1/forecast";

const DataSection: React.FC<SlidersComponentProps> = () => {
  const [months, setMonths] = useState<number>(120);
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

const REQUEST_TIMEOUT = 8000; 

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
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("[TIMEOUT] El servidor tardó demasiado.");
      console.log("[FALLBACK] Usando datos del JSON...");
      useFallbackData();
    } else if (err instanceof TypeError) {
      console.error("[NETWORK ERROR]", err);
      console.log("[FALLBACK] Usando datos del JSON...");
      useFallbackData();
    } else {
      console.error("[UNKNOWN ERROR]", err);
      setError("Ocurrió un error inesperado al solicitar los datos.");
    }
  } finally {
    setLoading(false);
  }
};

const useFallbackData = () => {
  try {
    const { dates, predictions, last_16_dates, last_16_values } = dataSample.data;
    
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
    setError(null);
  } catch (err) {
    console.error("[FALLBACK ERROR]", err);
    setError("No se pudieron cargar los datos del servidor ni del archivo local.");
  }
};


  useEffect(() => {
    fetchForecast(months);
  }, [months]);

  useEffect(() => {
    if (dataSample?.data?.consequences) {
      setConsequences(dataSample.data.consequences);
    }
  }, []);

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
                interval={0}            
                minTickGap={10}         
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
        <div className="consequences-list">
          {consequences.map((consequence, index) => (
            <div key={index} className="consequence-item">
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataSection;
