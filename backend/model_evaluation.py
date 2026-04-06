import os
import pickle
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

BASE = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE, "..", "datasets", "raw", "f2.csv")
MODEL_PATH = os.path.join(BASE, "..", "notebooks", "classifier.pkl")
ENC_PATH = os.path.join(BASE, "..", "notebooks", "fertilizer.pkl")

# Load model + label encoder
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)
with open(ENC_PATH, "rb") as f:
    encoder = pickle.load(f)

# Load dataset
df = pd.read_csv(DATA_PATH)

# Add this normalization to handle the CSV header typo
if "Temparature" in df.columns and "Temperature" not in df.columns:
    df = df.rename(columns={"Temparature": "Temperature"})

# Infer label column
possible_labels = ["Fertilizer", "Fertilizer_Name", "Fertilizer_Type", "fertilizer"]
label_col = next((c for c in possible_labels if c in df.columns), None)
if label_col is None:
    raise ValueError(f"Label column not found. Available columns: {list(df.columns)}")

# Build type lists (same logic as API)
if "Crop_Type" not in df.columns or "Soil_Type" not in df.columns:
    raise ValueError("Expected columns 'Crop_Type' and 'Soil_Type' not found in f2.csv")
CROP_TYPES = sorted(df["Crop_Type"].dropna().unique().tolist())
SOIL_TYPES = sorted(df["Soil_Type"].dropna().unique().tolist())

required_features = ["Temperature", "Humidity", "Moisture",
                     "Nitrogen", "Phosphorous", "Potassium",
                     "Soil_Type", "Crop_Type"]
missing = [c for c in required_features if c not in df.columns]
if missing:
    raise ValueError(f"Missing required feature columns: {missing}")

# Drop rows with missing essentials
df = df.dropna(subset=required_features + [label_col]).copy()


# Normalize schema
if "Temparature" in df.columns and "Temperature" not in df.columns:
    df = df.rename(columns={"Temparature": "Temperature"})

required_features = ["Temperature", "Humidity", "Moisture",
                     "Nitrogen", "Phosphorous", "Potassium",
                     "Soil_Type", "Crop_Type"]
missing = [c for c in required_features if c not in df.columns]
if missing:
    raise ValueError(f"Missing required feature columns: {missing}")
    
# Encode categories to match API preprocessing
df["Soil_Enc"] = df["Soil_Type"].apply(lambda s: SOIL_TYPES.index(s) if s in SOIL_TYPES else np.nan)
df["Crop_Enc"] = df["Crop_Type"].apply(lambda s: CROP_TYPES.index(s) if s in CROP_TYPES else np.nan)
df = df.dropna(subset=["Soil_Enc", "Crop_Enc"])

X = pd.DataFrame({
    "Temperature": df["Temperature"].astype(float),
    "Humidity": df["Humidity"].astype(float),
    "Moisture": df["Moisture"].astype(float),
    "Soil_Type": df["Soil_Enc"].astype(int),
    "Crop_Type": df["Crop_Enc"].astype(int),
    "Nitrogen": df["Nitrogen"].astype(float),
    "Potassium": df["Potassium"].astype(float),
    "Phosphorous": df["Phosphorous"].astype(float),
})

# y_true as string labels, aligned with encoder classes
y_true_text = df[label_col].astype(str).values

# Train/test split (holdout)
X_train, X_test, y_train_text, y_test_text = train_test_split(
    X, y_true_text, test_size=0.2, random_state=42, stratify=y_true_text
)

# Predict and inverse-transform to text labels
y_pred_codes = model.predict(X_test)
y_pred_text = encoder.inverse_transform(y_pred_codes)

# Metrics
acc = accuracy_score(y_test_text, y_pred_text)
print(f"Accuracy: {acc:.4f}")

print("\nClassification Report:")
print(classification_report(y_test_text, y_pred_text, zero_division=0))

print("\nConfusion Matrix (rows=true, cols=pred):")
labels_sorted = sorted(np.unique(np.concatenate([y_test_text, y_pred_text])))
cm = confusion_matrix(y_test_text, y_pred_text, labels=labels_sorted)
cm_df = pd.DataFrame(cm, index=labels_sorted, columns=labels_sorted)
print(cm_df.to_string())