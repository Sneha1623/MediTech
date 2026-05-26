import json
from pathlib import Path


ML_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = ML_DIR.parent / "artifacts"
MODELS_DIR = ARTIFACTS_DIR / "models"
DATASETS_DIR = ARTIFACTS_DIR / "datasets"
SKIN_DATASET_DIR = DATASETS_DIR / "skin_conditions"
SYMPTOM_DATASET_DIR = DATASETS_DIR / "symptom_clinical"
SKIN_MODEL_PATH = MODELS_DIR / "skin_condition_model.pkl"
SKIN_CNN_MODEL_PATH = MODELS_DIR / "skin_condition_cnn.pth"
SKIN_MODEL_METADATA_PATH = MODELS_DIR / "skin_condition_model_metadata.json"
SYMPTOM_MODEL_PATH = MODELS_DIR / "symptom_prediction_model.pkl"
SYMPTOM_MODEL_METADATA_PATH = MODELS_DIR / "symptom_prediction_model_metadata.json"


DEFAULT_DATASET_INFO = {
    "name": "No bundled skin-image dataset",
    "source": "This repository does not ship a labeled skin-disease dataset.",
    "path": str(SKIN_DATASET_DIR),
    "classes": [],
    "image_count": 0,
    "notes": [
        "Place labeled training images in class-named folders under artifacts/ai-backend/artifacts/datasets/skin_conditions.",
        "Example classes: acne, eczema, psoriasis, ringworm, normal_skin.",
        "Run the training script after adding data to create a real model.",
    ],
}

DEFAULT_SYMPTOM_DATASET_INFO = {
    "name": "No bundled clinical symptom dataset",
    "source": "This repository does not ship a labeled clinical symptom dataset.",
    "path": str(SYMPTOM_DATASET_DIR),
    "classes": [],
    "record_count": 0,
    "notes": [
        "Place a CSV dataset in artifacts/ai-backend/artifacts/datasets/symptom_clinical.",
        "Expected columns: disease,symptoms",
        "Use semicolon-separated symptom names in the symptoms column.",
    ],
}


def ensure_artifact_dirs() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    SKIN_DATASET_DIR.mkdir(parents=True, exist_ok=True)
    SYMPTOM_DATASET_DIR.mkdir(parents=True, exist_ok=True)


def load_dataset_info() -> dict:
    ensure_artifact_dirs()

    if not SKIN_MODEL_METADATA_PATH.exists():
        return DEFAULT_DATASET_INFO.copy()

    try:
        with SKIN_MODEL_METADATA_PATH.open("r", encoding="utf-8") as fh:
            metadata = json.load(fh)
        return metadata.get("dataset", DEFAULT_DATASET_INFO.copy())
    except Exception:
        return DEFAULT_DATASET_INFO.copy()


def save_model_metadata(metadata: dict) -> None:
    ensure_artifact_dirs()
    with SKIN_MODEL_METADATA_PATH.open("w", encoding="utf-8") as fh:
        json.dump(metadata, fh, indent=2)


def load_symptom_dataset_info() -> dict:
    ensure_artifact_dirs()

    if not SYMPTOM_MODEL_METADATA_PATH.exists():
        return DEFAULT_SYMPTOM_DATASET_INFO.copy()

    try:
        with SYMPTOM_MODEL_METADATA_PATH.open("r", encoding="utf-8") as fh:
            metadata = json.load(fh)
        return metadata.get("dataset", DEFAULT_SYMPTOM_DATASET_INFO.copy())
    except Exception:
        return DEFAULT_SYMPTOM_DATASET_INFO.copy()


def save_symptom_model_metadata(metadata: dict) -> None:
    ensure_artifact_dirs()
    with SYMPTOM_MODEL_METADATA_PATH.open("w", encoding="utf-8") as fh:
        json.dump(metadata, fh, indent=2)
