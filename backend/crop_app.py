from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
from tensorflow.keras.models import load_model
from werkzeug.utils import secure_filename
import sys

# Add src directory to path to import preprocessing
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from utils.preprocessing import preprocess_single_image, get_data_generators

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# SRC_DIR = os.path.join(BASE_DIR, '..', 'src')
# MODEL_DIR = os.path.join(SRC_DIR, 'models')
MODEL_DIR = os.path.join(BASE_DIR, 'models')
DATASET_DIR = os.path.join(BASE_DIR, 'data', 
                           'Plant_leaf_diseases_dataset_without_augmentation')

# MODEL_PATH = os.path.join(MODEL_DIR, 'crop_disease_mobilenetv2.h5')
MODEL_PATH = os.path.join(MODEL_DIR, 'crop_disease_mobilenetv2_final.h5')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'JPG', 'JPEG', 'PNG'}
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global variables
model = None
index_to_class = None
class_indices = None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_model_with_compatibility_fix(model_path):
    """Load model with compatibility fix for quantization_config issue."""
    import tensorflow as tf
    from tensorflow.keras.layers import Dense
    
    # Monkey patch Dense.from_config to ignore quantization_config
    original_from_config = Dense.from_config
    
    @classmethod
    def from_config_fixed(cls, config):
        config = config.copy()
        config.pop('quantization_config', None)
        return original_from_config(config)
    
    Dense.from_config = from_config_fixed
    
    try:
        # Try loading with compile=False
        model = load_model(model_path, compile=False)
        return model
    except Exception as e:
        print(f"First attempt failed: {e}")
        # Restore original method
        Dense.from_config = original_from_config
        
        # Try the final model as fallback
        final_model_path = model_path.replace('crop_disease_mobilenetv2.h5', 'crop_disease_mobilenetv2_final.h5')
        if os.path.exists(final_model_path) and final_model_path != model_path:
            print(f"Trying alternative model: {final_model_path}")
            try:
                model = load_model(final_model_path, compile=False)
                return model
            except Exception as e2:
                print(f"Alternative model also failed: {e2}")
                raise e2
        raise e
    finally:
        # Always restore original method
        try:
            Dense.from_config = original_from_config
        except:
            pass

def load_model_and_classes():
    """Load the trained model and class mappings."""
    global model, index_to_class, class_indices
    
    if not os.path.exists(MODEL_PATH):
        print(f"ERROR: Model file not found at {MODEL_PATH}")
        return False
    
    try:
        print(f"Loading model from {MODEL_PATH}...")
        model = load_model_with_compatibility_fix(MODEL_PATH)
        print("Model loaded successfully!")
        
        # Load class indices from dataset structure
        print("Loading class indices from dataset...")
        train_gen, _ = get_data_generators(
            dataset_path=DATASET_DIR,
            img_size=(224, 224),
            batch_size=32
        )
        class_indices = train_gen.class_indices
        index_to_class = {v: k for k, v in class_indices.items()}
        print(f"Loaded {len(index_to_class)} classes")
        return True
    except Exception as e:
        print(f"ERROR: Failed to load model or classes: {e}")
        import traceback
        traceback.print_exc()
        return False

# Load model at startup
if not load_model_and_classes():
    print("WARNING: Model not loaded. API will not function properly.")

# -------------------------------
# Health Check
# -------------------------------
@app.route("/health", methods=["GET"])
def health():
    status = "ready" if model is not None else "model_not_loaded"
    return jsonify({
        "status": status,
        "message": "Crop Disease Detection API is running ✅" if model else "Model not loaded ❌"
    }), 200

# -------------------------------
# Get Available Classes
# -------------------------------
@app.route("/classes", methods=["GET"])
def get_classes():
    if class_indices is None:
        return jsonify({"error": "Classes not loaded"}), 500
    
    classes = sorted(class_indices.keys())
    return jsonify({
        "classes": classes,
        "total": len(classes)
    }), 200

# -------------------------------
# Prediction Endpoint
# -------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    # Check if file is present
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided. Use 'image' as the form field name."}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            "error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        }), 400
    
    try:
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Preprocess image
        img_array = preprocess_single_image(filepath, img_size=(224, 224))
        
        # Predict
        predictions = model.predict(img_array, verbose=0)
        pred_index = int(np.argmax(predictions, axis=1)[0])
        confidence = float(np.max(predictions))
        
        # Get class name
        disease_name = index_to_class.get(pred_index, f"class_{pred_index}")
        
        # Format disease name (replace underscores with spaces, title case)
        formatted_name = disease_name.replace('_', ' ').title()
        
        # Determine confidence level
        confidence_percent = confidence * 100
        if confidence_percent >= 80:
            confidence_level = "High"
        elif confidence_percent >= 60:
            confidence_level = "Medium"
        else:
            confidence_level = "Low"
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        # Response
        return jsonify({
            "disease": formatted_name,
            "disease_raw": disease_name,
            "confidence": confidence_level,
            "confidence_score": round(confidence_percent, 2),
            "class_index": pred_index
        }), 200
        
    except Exception as e:
        # Clean up on error
        if 'filepath' in locals() and os.path.exists(filepath):
            try:
                os.remove(filepath)
            except:
                pass
        
        return jsonify({
            "error": f"Prediction failed: {str(e)}"
        }), 500

# -------------------------------
# Run App
# -------------------------------
if __name__ == "__main__":
    print("\n" + "="*50)
    print("Crop Disease Detection API")
    print("="*50)
    print(f"Model: {MODEL_PATH}")
    print(f"Dataset: {DATASET_DIR}")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print("="*50 + "\n")
    
    app.run(debug=True, host="0.0.0.0", port=5001)
