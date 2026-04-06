from flask import Flask, request, jsonify
import pickle
import pandas as pd
import numpy as np
import os

# Initialize Flask app
app = Flask(__name__)

from flask_cors import CORS
CORS(app)

# -------------------------------
# Load Models (file-relative paths)
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

MODEL_PATH = os.path.join(MODEL_DIR, "classifier.pkl")
ENCODER_PATH = os.path.join(MODEL_DIR, "fertilizer.pkl")
DATA_PATH = os.path.join(DATA_DIR,"fertilizer_dataset","raw","f2.csv")
model = None
fertilizer_encoder = None
try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(ENCODER_PATH, "rb") as f:
        fertilizer_encoder = pickle.load(f)
    print(f"SUCCESS: Loaded model from {MODEL_PATH}")
except Exception as e:
    print(f"ERROR: Error loading model or encoder: {e} | MODEL_PATH={MODEL_PATH} | ENCODER_PATH={ENCODER_PATH}")

# -------------------------------
# Fertilizer Info & Safety
# -------------------------------
from fertilizer_data import fertilizer_info, fertilizer_safety

# -------------------------------
# Allowed Soil & Crop Types
# -------------------------------

# Load dataset once at startup
try:
    data = pd.read_csv(DATA_PATH)
    CROP_TYPES = sorted(data['Crop_Type'].unique().tolist())
    SOIL_TYPES = sorted(data['Soil_Type'].unique().tolist())
    print(f"SUCCESS: Loaded {len(CROP_TYPES)} crop types and {len(SOIL_TYPES)} soil types from {DATA_PATH}")
except Exception as e:
    print(f"ERROR: Error loading types from {DATA_PATH}: {e}")
    # Fallback to hardcoded values
    CROP_TYPES = ["Barley", "Cotton", "Ground Nuts", "Maize", "Millets", 
                  "Oil seeds", "Paddy", "Pulses", "Sugarcane", "Tobacco", "Wheat"]
    SOIL_TYPES = ["Black", "Clayey", "Loamy", "Red", "Sandy"]
# -------------------------------
# Health Check
# -------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "API is running ✅"}), 200

# -------------------------------
# Soil Types Endpoint
# -------------------------------
@app.route("/soil-types", methods=["GET"])
def soil_types():
    return jsonify({"soil_types": SOIL_TYPES}), 200

# -------------------------------
# Crop Types Endpoint
# -------------------------------
@app.route("/crop-types", methods=["GET"])
def crop_types():
    return jsonify({"crop_types": CROP_TYPES}), 200

# -------------------------------
# Prediction Endpoint
# -------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    if model is None or fertilizer_encoder is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json

    # Required fields
    required_fields = [
        "Temperature", "Humidity", "Moisture",
        "Nitrogen", "Phosphorous", "Potassium",
        "Soil_Type", "Crop_Type"
    ]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    try:
        # -------------------------------
        # Data Validation
        # -------------------------------
        temp = float(data["Temperature"])
        hum = float(data["Humidity"])
        moi = float(data["Moisture"])
        n = float(data["Nitrogen"])
        p = float(data["Phosphorous"])
        k = float(data["Potassium"])
        soil = data["Soil_Type"]
        crop = data["Crop_Type"]

        if not (0 <= temp <= 50):
            return jsonify({"error": "Temperature must be between 0-50°C"}), 400
        if not (0 <= hum <= 100):
            return jsonify({"error": "Humidity must be between 0-100%"}), 400
        if not (0 <= moi <= 100):
            return jsonify({"error": "Moisture must be between 0-100%"}), 400
        if n < 0 or p < 0 or k < 0:
            return jsonify({"error": "Nutrients must be positive values"}), 400
        if soil not in SOIL_TYPES:
            return jsonify({"error": f"Invalid Soil_Type. Allowed: {SOIL_TYPES}"}), 400
        if crop not in CROP_TYPES:
            return jsonify({"error": f"Invalid Crop_Type. Allowed: {CROP_TYPES}"}), 400

        # -------------------------------
        # Prepare Data for Prediction
        # -------------------------------
        # Encode soil and crop types to numbers
        soil_encoded = SOIL_TYPES.index(soil)
        crop_encoded = CROP_TYPES.index(crop)

        sample = pd.DataFrame([{
            "Temperature": temp,
            "Humidity": hum,
            "Moisture": moi,
            "Soil_Type": soil_encoded,
            "Crop_Type": crop_encoded,
            "Nitrogen": n,
            "Potassium": k,
            "Phosphorous": p
        }])

        # Predict
        prediction = model.predict(sample)
        fert_name = fertilizer_encoder.inverse_transform(prediction)[0]

        # Confidence (using predict_proba)
        probs = model.predict_proba(sample)
        confidence = np.max(probs) * 100
        confidence_level = "High" if confidence >= 70 else "Medium" if confidence >= 40 else "Low"

        # Info + Safety
        info = fertilizer_info.get(fert_name, "No description available.")
        safety = fertilizer_safety.get(fert_name, "Handle with care. Follow standard agricultural guidelines.")

        # -------------------------------
        # Response
        # -------------------------------
        return jsonify({
            "fertilizer": fert_name,
            "confidence": confidence_level,
            "information": info,
            "safety_notes": safety,
            "input_data": data
        }), 200

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

# -------------------------------
# Run App
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
