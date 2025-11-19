import os
import json
import logging
import random
import sqlite3
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib

# Import your model
from ForecastModel import forecast_co2

# Gemini client
import google.generativeai as genai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- SQLite ----------
DB_PATH = "database.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Store forecast results
    cur.execute("""
        CREATE TABLE IF NOT EXISTS forecast_cache (
            months INTEGER PRIMARY KEY,
            dates TEXT NOT NULL,
            predictions TEXT NOT NULL,
            LASTDATES TEXT NOT NULL,
            LASTVALUES TEXT NOT NULL
        )
    """)

    # Store Gemini consequences
    cur.execute("""
        CREATE TABLE IF NOT EXISTS consequences (
            months INTEGER PRIMARY KEY,
            json TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()

def db_save_forecast(months: int, forecast: Dict[str, Any]):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        INSERT OR REPLACE INTO forecast_cache (months, dates, predictions,LASTDATES,LASTVALUES)
        VALUES (?, ?, ?, ?, ?)
    """, (months, json.dumps(forecast["dates"]), json.dumps(forecast["predictions"]),json.dumps(forecast["last_16_dates"]), json.dumps(forecast["last_16_values"])))
    conn.commit()
    conn.close()

def db_load_forecast(months: int) -> Optional[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT dates, predictions, LASTDATES, LASTVALUES FROM forecast_cache WHERE months = ?", (months,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "dates": json.loads(row[0]),
        "predictions": json.loads(row[1]),
        "last_16_dates": json.loads(row[2]),
        "last_16_values": json.loads(row[3])
    }

def db_save_consequences(months: int, consequences: List[Dict[str, Any]]):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        INSERT OR REPLACE INTO consequences (months, json)
        VALUES (?, ?)
    """, (months, json.dumps(consequences)))
    conn.commit()
    conn.close()

def db_load_consequences(months: int) -> Optional[List[Dict[str, Any]]]:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT json FROM consequences WHERE months = ?", (months,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return json.loads(row[0])


# ---------- Gemini ----------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
def call_gemini_api(prompt: str, model_name: str = "gemini-2.5-flash", temperature: float = 0.7, max_tokens: int = 8192) -> str:
    genai.configure(api_key=GEMINI_API_KEY)
    generation_config = genai.types.GenerationConfig(temperature=temperature, max_output_tokens=max_tokens)
    model = genai.GenerativeModel(model_name=model_name, generation_config=generation_config)
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error during API call: {str(e)}"


# ---------- Constants ----------
TheIcons = [
    "industry","smog","fire","car","truck","gas-pump","oil-can","temperature-high","thermometer-full","sun","cloud-sun","wind",
    "tornado","cloud-showers-heavy","bolt","solar-panel","water","leaf","recycle","seedling","plug","charging-station","mountain",
    "fire-flame-curved","skull-crossbones","house-flood-water","tree","fish","ban","chart-line","chart-bar","globe","satellite","microscope",
    "vial","filter","database","hands-helping","hand-holding-heart","lightbulb","bicycle","bus","trash-alt","shopping-bag","users","cloud",
    "umbrella","snowflake","icicles","volcano","earth-americas","compass","map","mountain-sun","hill-rockslide","water-ladder","droplet",
    "droplet-slash","fire-extinguisher","radiation","biohazard","recycle","trash","dumpster","dumpster-fire","receipt","cube","cubes","flask",
    "atom","virus","virus-slash","bacteria","bacterium","mask-face","hand-sparkles","hand-holding-water","seedling","spa","feather","kiwi-bird",
    "crow","frog","hippo","otter","dragon","paw","campground","tent","hiking","mountain-city","city","building","home","ship","plane","train",
    "subway","motorcycle","traffic-light","road","bridge"
]
DEFAULT_ICON = "ban"

acciones_climaticas = {
    "reducir_energia": {"action": "Reducir el consumo de energía en el hogar", "icon": "plug"},
    "usar_transporte_publico": {"action": "Usar transporte público o bicicleta", "icon": "bus"},
    "plantar_arboles": {"action": "Plantar árboles y restaurar bosques", "icon": "tree"},
    "reducir_carne": {"action": "Reducir consumo de carne y productos animales", "icon": "drumstick-bite"},
    "comprar_local": {"action": "Comprar productos locales y de temporada", "icon": "shopping-basket"},
    "reducir_residuos": {"action": "Reducir y evitar residuos (menos embalaje)", "icon": "trash-alt"},
    "reciclar": {"action": "Separar y reciclar correctamente", "icon": "recycle"},
    "compost": {"action": "Hacer compostaje de residuos orgánicos", "icon": "seedling"},
    "eficiencia_electrodomesticos": {"action": "Usar electrodomésticos eficientes (A++ / Energy Star)", "icon": "bolt"},
    "paneles_solares": {"action": "Instalar paneles solares o contratar energía renovable", "icon": "solar-panel"},
    "aislamiento": {"action": "Mejorar el aislamiento térmico de la vivienda", "icon": "home"},
    "bombillas_led": {"action": "Cambiar a bombillas LED de bajo consumo", "icon": "lightbulb"},
    "educacion_activismo": {"action": "Educar y participar en campañas/activismo climático", "icon": "users"},
    "apoyar_politicas": {"action": "Apoyar políticas públicas y líderes comprometidos", "icon": "handshake"},
    "reducir_vuelos": {"action": "Reducir viajes en avión y elegir alternativas", "icon": "plane"},
    "reparar_no_tirar": {"action": "Reparar objetos en lugar de tirar y comprar nuevo", "icon": "tools"},
    "menos_plastico": {"action": "Reducir uso de plásticos de un solo uso", "icon": "ban"},
    "ahorro_agua": {"action": "Optimizar el consumo de agua (duchas cortas, reparar fugas)", "icon": "tint"},
    "energia_renovable_contrato": {"action": "Contratar suministro de energía 100% renovable si es posible", "icon": "charging-station"},
    "invertir_sostenible": {"action": "Invertir o ahorrar en fondos sostenibles / verdes", "icon": "chart-line"},
    "consumo_responsable": {"action": "Practicar consumo responsable y minimalismo", "icon": "leaf"}
}


# ---------- Helpers unchanged except adding DB saving ----------
import re
def transformar_texto(texto_json: str, m: int) -> List[Dict[str, Any]]:
    try:
        raw = texto_json.strip()

        # ---- LIMPIEZA ROBUSTA ----
        # Quitar bloques de markdown tipo ```json ``` 
        raw = re.sub(r"^```[a-zA-Z]*", "", raw)
        raw = re.sub(r"```$", "", raw)
        raw = raw.strip()

        # Quitar BOM si existe
        raw = raw.replace("\ufeff", "")

        # Convertir comillas “curvas” a comillas "
        replacements = {
            "“": '"', "”": '"', "‘": "'", "’": "'"
        }
        for k, v in replacements.items():
            raw = raw.replace(k, v)

        # Quitar caracteres no imprimibles
        raw = "".join(c for c in raw if c.isprintable() or c in "\n\r\t ")

        # Si empieza con texto antes del JSON, intentar recortar
        # Busca primer corchete [
        start = raw.find("[")
        end = raw.rfind("]")
        if start != -1 and end != -1:
            raw = raw[start:end+1]

        # Parsear JSON con manejo de error
        try:
            data = json.loads(raw)
        except Exception:
            raise ValueError("JSON malformado recibido por Gemini")

        # Normalizar: si no es lista → convertir
        if not isinstance(data, list):
            data = [data]

        normalized = []

        # ---- VALIDACIÓN DE CADA OBJETO ----
        for item in data:
            if not isinstance(item, dict):
                continue

            desc = item.get("description", "").strip()
            if not desc:
                continue

            # impact_level
            try:
                impact = int(item.get("impact_level", 3))
                impact = max(1, min(5, impact))
            except:
                impact = 3

            # icon
            icon = item.get("icon", DEFAULT_ICON)
            if icon not in TheIcons:
                icon = DEFAULT_ICON

            normalized.append({
                "description": desc,
                "impact_level": impact,
                "icon": icon
            })

        # ---- EXACTAMENTE 5 ----
        if len(normalized) > 5:
            normalized = normalized[:5]

        while len(normalized) < 5:
            normalized.append({
                "description": "Aumento de forzamiento radiativo por mayor CO₂ atmosférico.",
                "impact_level": 5,
                "icon": "temperature-high"
            })

        # Guardar en SQLite
        db_save_consequences(m, normalized)

        return normalized

    except:
        logger.error("Error parseando la respuesta de Gemini: " + texto_json )
        logger.info("Usando consecuencias por defecto.")
        fallback = [
            {"description": "La tasa acelerada de incremento de CO₂ intensifica el forzamiento radiativo.", "impact_level": 5, "icon": "temperature-high"},
            {"description": "Acidificación oceánica por mayor absorción de CO₂.", "impact_level": 4, "icon": "droplet"},
            {"description": "Mayor frecuencia e intensidad de eventos extremos.", "impact_level": 5, "icon": "cloud-showers-heavy"},
            {"description": "Aceleración del derretimiento de glaciares.", "impact_level": 4, "icon": "snowflake"},
            {"description": "Estrés ecológico y pérdida de biodiversidad.", "impact_level": 4, "icon": "leaf"},
        ]
        return fallback

# === Configuración ===
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD") 
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


# ===== Modelo del cuerpo del request =====
class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    userEmail: EmailStr
    message: str


# ===== Función para enviar correo =====
def send_email(to_email: str, subject: str, user_email: str, message: str) -> bool:
    try:
        msg = MIMEMultipart()
        msg["From"] = GMAIL_ADDRESS
        msg["To"] = to_email
        msg["Subject"] = subject

        body_html = f"""
        <html>
            <body>
                <h2>Nuevo mensaje desde el formulario de contacto</h2>
                <p><strong>De:</strong> {user_email}</p>
                <p><strong>Asunto:</strong> {subject}</p>
                <hr>
                <p>{message}</p>
                <hr>
                <p style="font-size: 12px; color: #555;">
                    Este mensaje fue enviado desde LAirPrope - Modelo de Predicción de CO₂.
                </p>
            </body>
        </html>
        """

        msg.attach(MIMEText(body_html, "html"))

        # Conectar y enviar
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(GMAIL_ADDRESS, GMAIL_PASSWORD)
            server.send_message(msg)

        return True

    except Exception as e:
        print(f"[EMAIL ERROR] {str(e)}")
        return False



def forecast_co2_json(months: int) -> Dict[str, Any]:
    result = forecast_co2(months)
    dates = result.get("dates")
    preds = result.get("predictions")
    ldates = result.get("last_16_dates")
    lvalues = result.get("last_16_values")

    # Convert
    try:
        dates_list = [d.strftime("%Y-%m-%d") for d in dates]
        ldates_list = [d.strftime("%Y-%m-%d") for d in ldates]
    except:
        dates_list = [str(d) for d in dates]
        ldates_list = [str(d) for d in ldates]

    preds_list = [float(p) for p in preds]
    lvalues_list = [float(v) for v in lvalues]
    

    out = {"dates": dates_list, "predictions": preds_list, "last_16_dates": ldates_list,
        "last_16_values": lvalues_list}

    # SAVE IN DB
    db_save_forecast(months, out)

    return out


# ---------- FastAPI ----------
app = FastAPI()
api_sub = "/api/1"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ---------- ENDPOINTS ----------
@app.get(f"{api_sub}/forecast/{{months}}")
async def getForecast(months: int = 5):

    if months <= 0:
        return {"error": "months must be positive"}

    # 1. Try to load from DB
    forecas = db_load_forecast(months)

    if forecas:
        logger.info(f"Tried to load forecast for {months} months from DB")
    else:
        try:
            forecas = forecast_co2_json(months)
        except Exception as e:
            return {"error": str(e)}

    ThePrompt = (
    "Necesito que actúes como un experto en cambio climático y generes un JSON exclusivamente.\n"
    "El JSON debe describir las 5 principales consecuencias científicamente reconocidas que ocurrirían "
    "si el nivel de CO₂ (ppm) aumentara siguiendo esta proyección: " +
    f'{forecas["predictions"]} durante los próximos {months} meses.\n\n'
    "Debes cumplir estrictamente los siguientes requisitos:\n\n"
    "1. La respuesta debe ser ÚNICAMENTE un texto plano con forma de JSON sin explicación adicional, sin texto antes o después.\n"
    "2. El texto debe ser una lista de exactamente 5 objetos.\n"
    "3. Cada objeto debe tener la siguiente estructura obligatoria:\n"
    '   { "description": "<explicación clara, técnica y profesional>", "impact_level": <número entero entre 1 y 5>, "icon": "" }\n'
    "4. La descripción debe ser precisa, basada en ciencia climática y explicada en tono profesional, además debe ser corto.\n"
    "5. El impact_level debe representar la severidad (1 = bajo, 5 = crítico).\n"
    "6. El icono debe ser uno de los siguientes iconos y debe representar lo que se está diciendo en la consecuencia:\n" +
    f"{TheIcons}\n"
    "7. No debes incluir texto, comentarios, markdown ni explicaciones fuera del JSON.\n\n"
    "Si no puedes generar algún punto, debes generar igualmente el JSON, nunca otro tipo de salida."
)
    # 2. Try to load consequences from SQLite
    conseq = db_load_consequences(months)

    if conseq:
        logger.info(f"Loaded consequences for {months} months from DB")
    else:
        raw = call_gemini_api(prompt=ThePrompt)
        conseq = transformar_texto(raw, months)

    return {"data": forecas, "Consequences": conseq}


@app.get(f"{api_sub}/actions")
async def getActions5():
    pool = list(acciones_climaticas.items())
    return {"actions": random.sample(pool, min(5, len(pool)))}


@app.get(f"{api_sub}/actions/{{amm}}")
async def getActionsam(amm: int = 5):
    pool = list(acciones_climaticas.items())
    return {"actions": random.sample(pool, min(max(1, amm), len(pool)))}

# ===== Endpoint =====
@app.post("/api/email/send")
async def send_contact_email(request: EmailRequest):
    # Validación de campos
    if request.subject.strip() == "":
        raise HTTPException(status_code=400, detail="El asunto no puede estar vacío.")
    if request.message.strip() == "":
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío.")

    # Intentar enviar correo
    success = send_email(
        to_email=request.to,
        subject=request.subject,
        user_email=request.userEmail,
        message=request.message
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Error al enviar el correo. Intenta más tarde."
        )

    return {
        "success": True,
        "message": "Correo enviado exitosamente"
    }

