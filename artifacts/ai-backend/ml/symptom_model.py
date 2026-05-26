import pickle
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

from ml.dataset_metadata import (
    DEFAULT_SYMPTOM_DATASET_INFO,
    SYMPTOM_MODEL_METADATA_PATH,
    SYMPTOM_MODEL_PATH,
)
from ml.symptom_data import DISEASES, SYMPTOMS, generate_training_data


def _load_metadata():
    if not Path(SYMPTOM_MODEL_METADATA_PATH).exists():
        return None

    try:
        import json

        with open(SYMPTOM_MODEL_METADATA_PATH, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return None


def load_trained_symptom_model():
    if not Path(SYMPTOM_MODEL_PATH).exists():
        return None

    try:
        with open(SYMPTOM_MODEL_PATH, "rb") as fh:
            payload = pickle.load(fh)
    except Exception:
        return None

    if not isinstance(payload, dict):
        return None

    model = payload.get("model")
    label_encoder = payload.get("label_encoder")
    symptoms = payload.get("symptoms")
    if model is None or label_encoder is None or not symptoms:
        return None

    metadata = _load_metadata()

    return {
        "model": model,
        "label_encoder": label_encoder,
        "symptoms": symptoms,
        "model_source": "trained_clinical_dataset",
        "metadata": metadata,
    }


def build_demo_symptom_model():
    X, y = generate_training_data(samples_per_disease=50)
    label_encoder = LabelEncoder()
    y_enc = label_encoder.fit_transform(y)
    model = RandomForestClassifier(
        n_estimators=120,
        random_state=42,
        max_depth=10,
        class_weight="balanced",
    )
    model.fit(X, y_enc)

    return {
        "model": model,
        "label_encoder": label_encoder,
        "symptoms": SYMPTOMS,
        "model_source": "synthetic_demo",
        "metadata": {
            "model_name": "Synthetic symptom demo model",
            "dataset": {
                **DEFAULT_SYMPTOM_DATASET_INFO,
                "name": "Synthetic symptom vectors",
                "source": "Generated from hardcoded disease-to-symptom rules",
                "classes": DISEASES,
                "record_count": len(X),
            },
            "metrics": None,
            "notes": [
                "This is a demo-only model and not a clinically validated predictor.",
                "Replace it by training on a real labeled symptom dataset.",
            ],
        },
    }


def get_symptom_model_bundle():
    trained = load_trained_symptom_model()
    if trained is not None:
        return trained
    return build_demo_symptom_model()
