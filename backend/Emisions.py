#!/usr/bin/env python3
"""
Modelo LSTM estilo 'airline passengers', pero aplicado al CO2:
- Univariado
- Incluye estacionalidad porque la ventana captura los ciclos
- Carga y guarda igual que el ejemplo clásico
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import tensorflow as tf
from keras.models import Sequential, load_model
from keras.layers import Dense, LSTM, Input, Dropout
from sklearn.preprocessing import MinMaxScaler

DATA_FILE = "co2_mm_mlo.csv"
MODEL_FILE = "lstm_co2.keras"
LOOK_BACK = 12  # como tu WINDOW_SIZE


# =========================================================
# 1. Cargar datos CO2
# =========================================================
def load_co2():
    df = pd.read_csv(DATA_FILE, comment="#")
    df["average"] = df["average"].replace(-99.99, np.nan)
    df = df.dropna(subset=["average"])

    df["date"] = pd.to_datetime(dict(
        year=df["year"], month=df["month"], day=15
    ))

    df = df.set_index("date").sort_index()

    # Resample mensual
    ts = df["average"].resample("MS").mean()
    ts = ts.interpolate()

    return ts.values.reshape(-1, 1)


# =========================================================
# 2. Crear dataset estilo Airline Passengers
# =========================================================
def create_dataset(dataset, look_back=1):
    X, Y = [], []
    for i in range(len(dataset) - look_back - 1):
        X.append(dataset[i:(i + look_back), 0])
        Y.append(dataset[i + look_back, 0])
    return np.array(X), np.array(Y)


# =========================================================
# MAIN
# =========================================================
import joblib
def main():
    # 1. Cargar datos
    data = load_co2()

    # 2. Normalizar
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data)

    # 3. Dividir train/test
    train_size = int(len(data_scaled) * 0.80)
    train, test = data_scaled[:train_size], data_scaled[train_size:]

    # 4. Crear datasets tipo Airline
    trainX, trainY = create_dataset(train, LOOK_BACK)
    testX, testY = create_dataset(test, LOOK_BACK)

    # reshape para LSTM
    trainX = trainX.reshape((trainX.shape[0], LOOK_BACK, 1))
    testX = testX.reshape((testX.shape[0], LOOK_BACK, 1))

    # ===============================
    # 5. Modelo LSTM estilo Airline
    # ===============================
    model = Sequential([
        Input(shape=(LOOK_BACK, 1)),
        LSTM(96, return_sequences=True),
        LSTM(64),
        Dense(32),
        Dense(1)
    ])
    model.compile(loss="mse", optimizer="adam")

    model.fit(trainX, trainY, epochs=200, batch_size=20, verbose=1)

    # Guardar modelo y scalador
    joblib.dump(scaler, "ScalerFinal.pkl")
    model.save(MODEL_FILE)

    # ===============================
    # 6. Predicciones train/test
    # ===============================
    trainPred = model.predict(trainX)
    testPred = model.predict(testX)

    # Desescalar predicciones
    trainPred_inv = scaler.inverse_transform(trainPred)
    testPred_inv = scaler.inverse_transform(testPred)

    trainY_inv = scaler.inverse_transform(trainY.reshape(-1, 1))
    testY_inv = scaler.inverse_transform(testY.reshape(-1, 1))

    # ===============================
    # 7. Scores (RMSE)
    # ===============================
    from sklearn.metrics import mean_squared_error
    trainScore = np.sqrt(mean_squared_error(trainY_inv[:, 0], trainPred_inv[:, 0]))
    testScore = np.sqrt(mean_squared_error(testY_inv[:, 0], testPred_inv[:, 0]))

    print(f"Train Score: {trainScore:.2f} RMSE")
    print(f"Test Score:  {testScore:.2f} RMSE")

    # ===============================
    # 8. Pronóstico autoregresivo 10 años
    # ===============================
    FUTURE_MONTHS = 120  # 10 años

    future_preds = []
    last_window = data_scaled[-LOOK_BACK:].reshape(1, LOOK_BACK, 1)

    for i in range(FUTURE_MONTHS):
        next_value = model.predict(last_window, verbose=0)[0][0]

        future_preds.append(next_value)

        new_window = np.append(last_window.flatten()[1:], next_value)
        last_window = new_window.reshape(1, LOOK_BACK, 1)

    future_preds = scaler.inverse_transform(np.array(future_preds).reshape(-1, 1))

    # ===============================
    # 9. Preparar gráfico estilo Airline
    # ===============================
    full = scaler.inverse_transform(data_scaled)

    trainPlot = np.empty_like(full)
    trainPlot[:] = np.nan
    trainPlot[LOOK_BACK:len(trainPred_inv) + LOOK_BACK] = trainPred_inv

    testPlot = np.empty_like(full)
    testPlot[:] = np.nan
    testPlot[len(trainPred_inv) + LOOK_BACK * 2 + 1 : len(full) - 1] = testPred_inv

    # índices de tiempo
    full_idx = pd.date_range(start="1958-03-01", periods=len(full), freq="MS")
    future_idx = pd.date_range(start=full_idx[-1] + pd.offsets.MonthBegin(1),
                               periods=FUTURE_MONTHS, freq="MS")

    # ===============================
    # 10. Graficar
    # ===============================
    plt.figure(figsize=(13, 6))
    plt.plot(full_idx, full, label="Real")
    plt.plot(full_idx, trainPlot, label="Train Predict")
    plt.plot(full_idx, testPlot, label="Test Predict")
    plt.plot(future_idx, future_preds, label="Future Forecast (20 years)", linestyle='--')
    plt.title("CO₂ LSTM Forecast (10 years ahead)")
    plt.legend()
    plt.grid(True)
    plt.savefig("co2_forecast.png", dpi=150)
    plt.show()

main()
