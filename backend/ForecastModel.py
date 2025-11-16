import numpy as np
import pandas as pd
import joblib
from keras.models import load_model

LOOK_BACK = 12
MODEL_FILE = "ModelFinal.keras"
SCALER_FILE = "ScalerFinal.pkl"

MODEL = load_model(MODEL_FILE)
SCALER = joblib.load(SCALER_FILE)


# ===============================
#  Función para cargar tu dataset
# ===============================
def load_co2():
    df = pd.read_csv("co2_mm_mlo.csv")
    return df["average"].values.reshape(-1, 1)


# ===============================
#  Autoregresivo reutilizable
# ===============================
def autoregressive_forecast(model, last_sequence, steps, scaler):
    preds = []
    window = last_sequence.reshape(1, LOOK_BACK, 1)

    for _ in range(steps):
        # Usar el modelo directamente en vez de model.predict()
        next_value = model(window, training=False).numpy()[0][0]

        preds.append(next_value)

        new_window = np.append(window.flatten()[1:], next_value)
        window = new_window.reshape(1, LOOK_BACK, 1)

    preds = np.array(preds).reshape(-1, 1)
    preds = scaler.inverse_transform(preds)
    return preds


# ===============================
#   ⭐ FUNCIÓN PRINCIPAL ⭐
#   forecast_co2(months)
# ===============================
def forecast_co2(months):
    """
    Devuelve un objeto:
    {
        "dates": [...],
        "predictions": [...],
        "last_16_dates": [...],
        "last_16_values": [...]
    }
    """

    # 1. Leer últimos 16 meses del CSV
    df = pd.read_csv("co2_mm_mlo.csv")
    last_16_values = df["average"].tail(16).values

    # Crear las fechas correspondientes si el CSV tiene columnas de año/mes:
    if {"year", "month"}.issubset(df.columns):
        last_16_dates = [
            pd.Timestamp(year=int(row["year"]), month=int(row["month"]), day=1)
            for _, row in df.tail(16).iterrows()
        ]
    else:
        # Si el CSV NO trae fechas, las calculamos desde el largo del archivo
        n = len(df)
        last_16_dates = pd.date_range(
            start="1958-03-01",
            periods=n,
            freq="MS"
        )[-16:]

    # 2. Cargar datos reales
    data = load_co2()

    # 3. Normalizar
    data_scaled = SCALER.transform(data)

    # 4. Última ventana para forecasting
    last_seq = data_scaled[-LOOK_BACK:].flatten()

    # 5. Forecast autoregresivo
    preds = autoregressive_forecast(
        model=MODEL,
        last_sequence=last_seq,
        steps=months,
        scaler=SCALER
    )

    # 6. Fechas futuras
    last_date = pd.date_range(start="1958-03-01", periods=len(data), freq="MS")[-1]

    future_dates = pd.date_range(
        start=last_date + pd.offsets.MonthBegin(1),
        periods=months,
        freq="MS"
    )

    # 7. Retornar todo
    return {
        "dates": future_dates,
        "predictions": preds.flatten(),
        "last_16_dates": last_16_dates,
        "last_16_values": last_16_values
    }



# ===============================
# Ejemplo de uso
# ===============================

import matplotlib.pyplot as plt

if __name__ == "__main__":
    result = forecast_co2(240)   # 20 años (240 meses)

    dates = result["dates"]
    preds = result["predictions"]
    print(dates)

    plt.figure(figsize=(12, 6))
    plt.plot(dates, preds, label="Predicción CO₂ (ppm)")
    
    plt.title("Pronóstico de CO₂ para los próximos 20 años")
    plt.xlabel("Fecha")
    plt.ylabel("CO₂ (ppm)")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()

    plt.show()

