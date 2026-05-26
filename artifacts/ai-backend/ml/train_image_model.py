import argparse
import csv
import json
import pickle
import sys
from pathlib import Path

from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ml.dataset_metadata import (  # noqa: E402
    SKIN_DATASET_DIR,
    SKIN_MODEL_PATH,
    ensure_artifact_dirs,
    save_model_metadata,
)
from ml.image_model import extract_image_features  # noqa: E402


VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
EVAL_REPORT_PATH = SKIN_MODEL_PATH.with_name("skin_condition_model_report.json")
CONFUSION_MATRIX_PATH = SKIN_MODEL_PATH.with_name("skin_condition_confusion_matrix.csv")


def iter_class_images(root: Path):
    for class_dir in sorted(path for path in root.iterdir() if path.is_dir()):
        for image_path in sorted(class_dir.rglob("*")):
            if image_path.is_file() and image_path.suffix.lower() in VALID_EXTENSIONS:
                yield class_dir.name, image_path


def load_split(root: Path, label: str | None = None):
    features = []
    labels = []
    class_counts = {}
    processed = 0

    for label, image_path in iter_class_images(root):
        try:
            features.append(extract_image_features(image_path.read_bytes()))
            labels.append(label)
            class_counts[label] = class_counts.get(label, 0) + 1
            processed += 1
            if processed % 500 == 0:
                prefix = f"[{label}] " if label else ""
                print(f"{prefix}Processed {processed} images from {root}")
        except Exception as exc:
            print(f"Skipping {image_path}: {exc}")

    return features, labels, class_counts


def load_flat_only(dataset_dir: Path):
    features = []
    labels = []
    class_counts = {}
    reserved = {"train", "test", "testing", "val", "valid"}

    for class_dir in sorted(
        path for path in dataset_dir.iterdir() if path.is_dir() and path.name not in reserved
    ):
        for image_path in sorted(class_dir.rglob("*")):
            if image_path.is_file() and image_path.suffix.lower() in VALID_EXTENSIONS:
                try:
                    features.append(extract_image_features(image_path.read_bytes()))
                    labels.append(class_dir.name)
                    class_counts[class_dir.name] = class_counts.get(class_dir.name, 0) + 1
                except Exception as exc:
                    print(f"Skipping {image_path}: {exc}")

    return features, labels, class_counts


def train_from_flat_dataset(dataset_dir: Path, test_size: float):
    print(f"Loading flat dataset from {dataset_dir}")
    features, labels, class_counts = load_split(dataset_dir, label="flat")

    if len(features) < 10:
        raise SystemExit("Need at least 10 labeled images before training.")

    classes = sorted(set(labels))
    if len(classes) < 2:
        raise SystemExit("Need at least 2 classes before training.")

    X_train, X_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=test_size,
        random_state=42,
        stratify=labels,
    )

    return X_train, X_test, y_train, y_test, class_counts


def train_from_pre_split_dataset(dataset_dir: Path):
    train_dir = dataset_dir / "train"
    test_dir = dataset_dir / "test"
    if not test_dir.exists():
        test_dir = dataset_dir / "testing"
    val_dir = dataset_dir / "val"
    if not val_dir.exists():
        val_dir = dataset_dir / "valid"

    print(f"Loading train split from {train_dir}")
    X_train, y_train, train_counts = load_split(train_dir, label="train")
    if not X_train:
        raise SystemExit("No training images found in train split.")

    eval_dir = val_dir if val_dir.exists() else test_dir
    if not eval_dir.exists():
        raise SystemExit("Expected a val/valid or test split directory.")

    print(f"Loading evaluation split from {eval_dir}")
    X_test, y_test, eval_counts = load_split(eval_dir, label="eval")
    if not X_test:
        raise SystemExit("No evaluation images found in split dataset.")

    class_counts = {}
    for counts in (train_counts, eval_counts):
        for key, value in counts.items():
            class_counts[key] = class_counts.get(key, 0) + value

    return X_train, X_test, y_train, y_test, class_counts


def train_from_hybrid_dataset(dataset_dir: Path, test_size: float):
    X_train, X_test, y_train, y_test, class_counts = train_from_pre_split_dataset(dataset_dir)

    flat_features, flat_labels, flat_counts = load_flat_only(dataset_dir)
    if flat_features:
        flat_classes = sorted(set(flat_labels))
        if len(flat_classes) >= 2 and len(flat_features) >= 10:
            fx_train, fx_test, fy_train, fy_test = train_test_split(
                flat_features,
                flat_labels,
                test_size=test_size,
                random_state=42,
                stratify=flat_labels,
            )
            X_train.extend(fx_train)
            X_test.extend(fx_test)
            y_train.extend(fy_train)
            y_test.extend(fy_test)
        else:
            X_train.extend(flat_features)
            y_train.extend(flat_labels)

        for key, value in flat_counts.items():
            class_counts[key] = class_counts.get(key, 0) + value

    return X_train, X_test, y_train, y_test, class_counts


def fit_and_score_models(X_train, y_train, X_test, y_test):
    candidates = [
        (
            "random_forest",
            RandomForestClassifier(
                n_estimators=350,
                max_depth=22,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1,
                class_weight="balanced_subsample",
            ),
        ),
        (
            "extra_trees",
            ExtraTreesClassifier(
                n_estimators=500,
                max_depth=None,
                min_samples_leaf=1,
                random_state=42,
                n_jobs=-1,
                class_weight="balanced",
            ),
        ),
    ]

    best = None
    best_summary = None

    for name, model in candidates:
        print(f"Training candidate model: {name}")
        model.fit(X_train, y_train)
        predictions = model.predict(X_test)
        report = classification_report(y_test, predictions, output_dict=True, zero_division=0)
        metrics = {
            "accuracy": float(report.get("accuracy", 0.0)),
            "macro_avg_f1": float(report.get("macro avg", {}).get("f1-score", 0.0)),
        }
        print(
            f"{name} accuracy={metrics['accuracy']:.4f} macro_f1={metrics['macro_avg_f1']:.4f}"
        )
        summary = {
            "name": name,
            "model": model,
            "predictions": predictions,
            "report": report,
            "metrics": metrics,
        }
        if best_summary is None or (
            metrics["macro_avg_f1"],
            metrics["accuracy"],
        ) > (
            best_summary["metrics"]["macro_avg_f1"],
            best_summary["metrics"]["accuracy"],
        ):
            best_summary = summary
            best = model

    return best, best_summary


def save_evaluation_artifacts(classes, y_test, predictions, report, chosen_model_name):
    matrix = confusion_matrix(y_test, predictions, labels=classes)
    with open(CONFUSION_MATRIX_PATH, "w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["actual/predicted", *classes])
        for label, row in zip(classes, matrix.tolist()):
            writer.writerow([label, *row])

    payload = {
        "chosen_model": chosen_model_name,
        "classes": classes,
        "report": report,
    }
    with open(EVAL_REPORT_PATH, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Train the skin condition classifier.")
    parser.add_argument(
        "--dataset-dir",
        default=str(SKIN_DATASET_DIR),
        help="Dataset directory. Either class folders directly, or train/test(/val) split folders.",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Validation split ratio used only for flat datasets.",
    )
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir).resolve()
    ensure_artifact_dirs()

    if not dataset_dir.exists():
        raise SystemExit(f"Dataset directory not found: {dataset_dir}")

    has_presplit = (dataset_dir / "train").exists()
    has_flat_classes = any(
        path.is_dir() and path.name not in {"train", "test", "testing", "val", "valid"}
        for path in dataset_dir.iterdir()
    )

    if has_presplit and has_flat_classes:
        X_train, X_test, y_train, y_test, class_counts = train_from_hybrid_dataset(dataset_dir, args.test_size)
        split_strategy = "hybrid_dataset"
    elif has_presplit:
        X_train, X_test, y_train, y_test, class_counts = train_from_pre_split_dataset(dataset_dir)
        split_strategy = "pre_split_dataset"
    else:
        X_train, X_test, y_train, y_test, class_counts = train_from_flat_dataset(dataset_dir, args.test_size)
        split_strategy = "random_stratified_split"

    classes = sorted(set(y_train) | set(y_test))

    model, best_summary = fit_and_score_models(X_train, y_train, X_test, y_test)
    predictions = best_summary["predictions"]
    report = best_summary["report"]
    save_evaluation_artifacts(classes, y_test, predictions, report, best_summary["name"])

    payload = {
        "model": model,
        "classes": classes,
        "feature_version": "v3_histogram_hog_lbp_contour",
    }
    with open(SKIN_MODEL_PATH, "wb") as fh:
        pickle.dump(payload, fh)

    metadata = {
        "model_name": f"{best_summary['name']} skin condition classifier",
        "feature_version": payload["feature_version"],
        "dataset": {
            "name": "Local labeled skin-condition dataset",
            "source": "User-provided local dataset",
            "path": str(dataset_dir),
            "classes": classes,
            "image_count": sum(class_counts.values()),
            "class_counts": class_counts,
            "split_strategy": split_strategy,
        },
        "metrics": {
            "accuracy": round(report.get("accuracy", 0.0), 4),
            "macro_avg_f1": round(report.get("macro avg", {}).get("f1-score", 0.0), 4),
        },
        "artifacts": {
            "report_json": str(EVAL_REPORT_PATH),
            "confusion_matrix_csv": str(CONFUSION_MATRIX_PATH),
        },
    }
    save_model_metadata(metadata)

    print("Training complete.")
    print(f"Saved model: {SKIN_MODEL_PATH}")
    print(f"Saved report: {EVAL_REPORT_PATH}")
    print(f"Saved confusion matrix: {CONFUSION_MATRIX_PATH}")
    print(f"Accuracy: {metadata['metrics']['accuracy']}")
    print(f"Macro F1: {metadata['metrics']['macro_avg_f1']}")
    print(f"Classes: {', '.join(classes)}")


if __name__ == "__main__":
    main()
