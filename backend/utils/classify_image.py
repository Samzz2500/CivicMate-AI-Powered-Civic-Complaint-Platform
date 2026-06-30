import sys
import json
import numpy as np
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow warnings
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN warnings

from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import warnings
warnings.filterwarnings('ignore')

MODEL_PATH = os.path.join(os.path.dirname(__file__), "civicmate_image_model.h5")
model = load_model(MODEL_PATH, compile=False)

CLASS_NAMES = [
    "drainage",
    "garbage",
    "others",
    "potholes",
    "public washroom",
    "streetlight",
    "water_leakage",
]

# Valid civic issue classes (excluding "others")
VALID_CIVIC_CLASSES = [
    "drainage",
    "garbage",
    "potholes",
    "public washroom",
    "streetlight",
    "water_leakage",
]

CONFIDENCE_THRESHOLD = 0.30  # Lower threshold to accept more civic images

def predict_image(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    predictions = model.predict(img_array, verbose=0)  # Suppress progress bar
    confidence = float(np.max(predictions))
    class_index = int(np.argmax(predictions))
    predicted_class = CLASS_NAMES[class_index]

    return predicted_class, confidence


def main():
    try:
        img_path = sys.argv[1]
        predicted_class, confidence = predict_image(img_path)

        # Reject "others" class entirely - it means non-civic image
        if predicted_class == "others":
            is_valid = False
        elif predicted_class in VALID_CIVIC_CLASSES:
            # Valid civic classes need normal threshold
            is_valid = confidence >= CONFIDENCE_THRESHOLD
        else:
            # Unknown class - reject
            is_valid = False

        print(json.dumps({
            "valid": is_valid,
            "class": predicted_class,
            "confidence": confidence,
            "error": None
        }))

    except Exception as e:
        print(json.dumps({
            "valid": False,
            "class": None,
            "confidence": 0.0,
            "error": str(e)
        }))


if __name__ == "__main__":
    main()
