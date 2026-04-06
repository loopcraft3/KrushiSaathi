import os

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping

from utils.preprocessing import get_data_generators


def build_model(input_shape, num_classes):
    base_model = MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False  # freeze base for initial training

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.3)(x)
    outputs = Dense(num_classes, activation="softmax")(x)

    model = Model(inputs=base_model.input, outputs=outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    # Adjust this path if your dataset folder name changes
    dataset_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "data",
        "Plant_leaf_diseases_dataset_without_augmentation",
        "Plant_leave_diseases_dataset_without_augmentation",
    )
    dataset_path = os.path.abspath(dataset_path)

    img_size = (224, 224)
    batch_size = 32
    epochs = 10

    train_gen, val_gen = get_data_generators(
        dataset_path=dataset_path, img_size=img_size, batch_size=batch_size
    )

    num_classes = train_gen.num_classes
    input_shape = img_size + (3,)

    model = build_model(input_shape, num_classes)

    # os.makedirs(os.path.join(os.path.dirname(__file__), "models"), exist_ok=True)
    models_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "models")
    )
    os.makedirs(models_dir, exist_ok=True)

    # checkpoint_path = os.path.join(
    #     os.path.dirname(__file__), "models", "crop_disease_mobilenetv2.h5"
    # )
    checkpoint_path = os.path.join(
        models_dir, "crop_disease_mobilenetv2.h5"
    )

    callbacks = [
        ModelCheckpoint(
            checkpoint_path,
            monitor="val_accuracy",
            save_best_only=True,
            mode="max",
            verbose=1,
        ),
        EarlyStopping(
            monitor="val_accuracy",
            patience=3,
            mode="max",
            restore_best_weights=True,
            verbose=1,
        ),
    ]

    model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=epochs,
        callbacks=callbacks,
    )

    # Save final model as well
    # final_model_path = os.path.join(
    #     os.path.dirname(__file__), "models", "crop_disease_mobilenetv2_final.h5"
    # )
    final_model_path = os.path.join(
        models_dir, "crop_disease_mobilenetv2_final.h5"
    )

    model.save(final_model_path)
    print(f"Training complete. Best model: {checkpoint_path}")
    print(f"Final model: {final_model_path}")


if __name__ == "__main__":
    main()

