import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator, load_img, img_to_array


def get_data_generators(dataset_path, img_size=(224, 224), batch_size=32, val_split=0.2):
    """
    Create training and validation generators with stronger augmentations.
    """
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=val_split,
        rotation_range=30,
        zoom_range=0.25,
        width_shift_range=0.1,
        height_shift_range=0.1,
        shear_range=0.1,
        horizontal_flip=True,
        brightness_range=(0.8, 1.2),
        fill_mode="nearest",
    )

    # Use only rescaling for validation to measure performance fairly
    val_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=val_split,
    )

    train_data = train_datagen.flow_from_directory(
        dataset_path,
        target_size=img_size,
        batch_size=batch_size,
        class_mode="categorical",
        subset="training",
        shuffle=True,
    )

    val_data = val_datagen.flow_from_directory(
        dataset_path,
        target_size=img_size,
        batch_size=batch_size,
        class_mode="categorical",
        subset="validation",
        shuffle=False,
    )

    return train_data, val_data


def preprocess_single_image(image_path, img_size=(224, 224)):
    """
    Load and preprocess a single image for prediction.

    Returns:
        np.ndarray of shape (1, img_size[0], img_size[1], 3)
    """
    img = load_img(image_path, target_size=img_size)
    img_array = img_to_array(img)
    # img_array = img_array / 255.0 
    img_array = img_array.astype("float32") / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array
