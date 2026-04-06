import os
import sys

import numpy as np
from tensorflow.keras.models import load_model

from utils.preprocessing import preprocess_single_image, get_data_generators


def load_class_indices(dataset_path, img_size=(224, 224), batch_size=32):
    """
    Build a temporary generator to recover class indices mapping.
    """
    train_gen, _ = get_data_generators(
        dataset_path=dataset_path,
        img_size=img_size,
        batch_size=batch_size,
    )
    # class_indices: dict {class_name: index}
    class_indices = train_gen.class_indices
    # invert to get {index: class_name}
    index_to_class = {v: k for k, v in class_indices.items()}
    return index_to_class


def predict_image(image_path, model_path, dataset_path):
    img_size = (224, 224)

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at: {model_path}")

    model = load_model(model_path)

    # Load index-to-class mapping based on dataset folder structure
    index_to_class = load_class_indices(dataset_path, img_size=img_size)

    img_array = preprocess_single_image(image_path, img_size=img_size)

    preds = model.predict(img_array)
    pred_index = int(np.argmax(preds, axis=1)[0])
    pred_class = index_to_class.get(pred_index, f"class_{pred_index}")
    confidence = float(np.max(preds))

    return pred_class, confidence


def main():
    if len(sys.argv) < 2:
        print("Usage: python src/predict.py <path_to_leaf_image>")
        sys.exit(1)

    image_path = sys.argv[1]

    base_dir = os.path.dirname(__file__)

    dataset_path = os.path.abspath(
        os.path.join(
            base_dir,
            "..",
            "data",
            "Plant_leaf_diseases_dataset_without_augmentation",
            "Plant_leave_diseases_dataset_without_augmentation",
        )
    )

    # model_path = os.path.join(base_dir, "models", "crop_disease_mobilenetv2.h5")
    model_path = os.path.abspath(
        os.path.join(base_dir, "..", "models", "crop_disease_mobilenetv2.h5")
    )
    pred_class, confidence = predict_image(image_path, model_path, dataset_path)

    print(f"Predicted disease/class: {pred_class}")
    print(f"Confidence: {confidence:.4f}")


if __name__ == "__main__":
    main()

