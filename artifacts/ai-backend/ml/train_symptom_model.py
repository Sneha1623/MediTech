import argparse
import csv
import pickle
import sys
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ml.dataset_metadata import (  # noqa: E402
    SYMPTOM_DATASET_DIR,
    SYMPTOM_MODEL_PATH,
    ensure_artifact_dirs,
    save_symptom_model_metadata,
)


def normalize_symptom_name(value: str) -> str:
    return value.strip().lower().replace(" ", "_")


def parse_rows(csv_path: Path):
    rows = []
    symptoms_vocab = set()

    with csv_path.open("r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        required = {"disease", "symptoms"}
        if not required.issubset(reader.fieldnames or []):
            raise SystemExit("CSV must contain disease and symptoms columns.")

        for row in reader:
            disease = (row.get("disease") or "").strip()
            raw_symptoms = (row.get("symptoms") or "").strip()
            if not disease or not raw_symptoms:
                continue

            symptoms = [
                normalize_symptom_name(symptom)
                for symptom in raw_symptoms.split(";")
                if symptom.strip()
            ]
            if not symptoms:
                continue

            symptoms_vocab.update(symptoms)
            rows.append({"disease": disease, "symptoms": symptoms})

    return rows, sorted(symptoms_vocab)


def build_feature_matrix(rows, symptoms_vocab):
    symptom_index = {symptom: idx for idx, symptom in enumerate(symptoms_vocab)}
    features = []
    labels = []

    for row in rows:
        vector = [0] * len(symptoms_vocab)
        for symptom in row["symptoms"]:
            idx = symptom_index.get(symptom)
            if idx is not None:
                vector[idx] = 1
        features.append(vector)
        labels.append(row["disease"])

    return features, labels


def main():
    parser = argparse.ArgumentParser(description="Train symptom predictor from a labeled CSV dataset.")
    parser.add_argument(
        "--csv",
        default=str(SYMPTOM_DATASET_DIR / "symptom_cases.csv"),
        help="Path to the labeled symptom dataset CSV.",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Validation split ratio.",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv).resolve()
    ensure_artifact_dirs()

    if not csv_path.exists():
        raise SystemExit(f"Dataset CSV not found: {csv_path}")

    rows, symptoms_vocab = parse_rows(csv_path)
    if len(rows) < 20:
        raise SystemExit("Need at least 20 labeled symptom records before training.")

    disease_counts = {}
    for row in rows:
        disease_counts[row["disease"]] = disease_counts.get(row["disease"], 0) + 1

    if len(disease_counts) < 2:
        raise SystemExit("Need at least 2 disease classes before training.")

    features, labels = build_feature_matrix(rows, symptoms_vocab)
    X_train, X_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=args.test_size,
        random_state=42,
        stratify=labels,
    )

    label_encoder = LabelEncoder()
    y_train_enc = label_encoder.fit_transform(y_train)
    y_test_enc = label_encoder.transform(y_test)

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=18,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    model.fit(X_train, y_train_enc)

    predictions = model.predict(X_test)
    report = classification_report(y_test_enc, predictions, output_dict=True, zero_division=0)

    payload = {
        "model": model,
        "label_encoder": label_encoder,
        "symptoms": symptoms_vocab,
        "feature_version": "v1_binary_symptom_presence",
    }
    with open(SYMPTOM_MODEL_PATH, "wb") as fh:
        pickle.dump(payload, fh)

    metadata = {
        "model_name": "RandomForest symptom predictor",
        "feature_version": payload["feature_version"],
        "dataset": {
            "name": "Local labeled symptom dataset",
            "source": "User-provided clinical/tabular symptom dataset",
            "path": str(csv_path),
            "classes": sorted(disease_counts.keys()),
            "record_count": len(rows),
            "symptom_vocabulary_size": len(symptoms_vocab),
            "class_counts": disease_counts,
        },
        "metrics": {
            "accuracy": round(report.get("accuracy", 0.0), 4),
            "macro_avg_f1": round(report.get("macro avg", {}).get("f1-score", 0.0), 4),
        },
    }
    save_symptom_model_metadata(metadata)

    print("Training complete.")
    print(f"Saved model: {SYMPTOM_MODEL_PATH}")
    print(f"Accuracy: {metadata['metrics']['accuracy']}")
    print(f"Diseases: {', '.join(metadata['dataset']['classes'])}")


if __name__ == "__main__":
    main()
