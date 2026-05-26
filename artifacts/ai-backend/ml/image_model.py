import io
import pickle
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
import torch
from torchvision import models, transforms

from ml.dataset_metadata import (
    SKIN_CNN_MODEL_PATH,
    SKIN_MODEL_PATH,
    load_dataset_info,
)


FALLBACK_CONDITIONS = [
    "acne",
    "fungal_infection",
    "normal_skin",
    "wound_normal",
    "wound_infected",
]

CONDITION_LABELS = {
    "acne": "Acne",
    "actinic_keratosis": "Actinic Keratosis",
    "atopic_dermatitis": "Atopic Dermatitis",
    "basal_cell_carcinoma": "Basal Cell Carcinoma",
    "benign_keratosis_like_lesions": "Benign Keratosis-like Lesions",
    "eczema": "Eczema",
    "melanocytic_nevi": "Melanocytic Nevi",
    "melanoma": "Melanoma",
    "psoriasis": "Psoriasis",
    "psoriasis_lichen_planus": "Psoriasis / Lichen Planus",
    "rosacea": "Rosacea",
    "seborrheic_keratoses": "Seborrheic Keratoses",
    "fungal_infection": "Fungal Infection",
    "ringworm": "Ringworm",
    "viral_warts_molluscum": "Viral Warts / Molluscum",
    "normal_skin": "Normal Skin",
    "wound_normal": "Wound (Normal)",
    "wound_infected": "Wound (Infected)",
}

CONDITION_DESCRIPTIONS = {
    "acne": "Pattern resembles inflamed acne or follicular eruptions.",
    "actinic_keratosis": "Pattern resembles a sun-damaged rough precancerous skin lesion.",
    "atopic_dermatitis": "Pattern resembles chronic itchy dermatitis with inflamed dry patches.",
    "basal_cell_carcinoma": "Pattern resembles a lesion that should be reviewed promptly by dermatology.",
    "benign_keratosis_like_lesions": "Pattern resembles a benign keratotic skin lesion.",
    "eczema": "Pattern resembles dry, inflamed dermatitis-like skin changes.",
    "melanocytic_nevi": "Pattern resembles a pigmented mole-like lesion.",
    "melanoma": "Pattern resembles a suspicious pigmented lesion that needs urgent specialist review.",
    "psoriasis": "Pattern resembles scaly plaque-like lesions that may need dermatology review.",
    "psoriasis_lichen_planus": "Pattern resembles psoriasis or a related inflammatory plaque-like eruption.",
    "rosacea": "Pattern resembles facial redness and papule-pustule changes seen in rosacea.",
    "seborrheic_keratoses": "Pattern resembles a benign waxy or stuck-on skin growth.",
    "fungal_infection": "Pattern resembles a superficial fungal infection with irregular discoloration.",
    "ringworm": "Pattern resembles a ring-like fungal lesion.",
    "viral_warts_molluscum": "Pattern resembles viral papules such as warts or molluscum lesions.",
    "normal_skin": "Skin appears relatively even without a strong lesion pattern.",
    "wound_normal": "A wound-like region is visible without strong infection indicators.",
    "wound_infected": "A wound-like region is visible with stronger inflammation or discharge-like features.",
}


def pil_image_from_bytes(image_bytes):
    try:
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise ValueError(f"Image processing error: {exc}") from exc


def extract_image_features(image_bytes):
    img = pil_image_from_bytes(image_bytes).resize((224, 224))
    rgb = np.array(img)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    features = []

    for channel in cv2.split(rgb):
        hist = cv2.calcHist([channel], [0], None, [24], [0, 256]).flatten()
        hist = hist / (hist.sum() + 1e-9)
        features.extend(hist.tolist())

    for channel in cv2.split(hsv):
        hist = cv2.calcHist([channel], [0], None, [24], [0, 256]).flatten()
        hist = hist / (hist.sum() + 1e-9)
        features.extend(hist.tolist())

    mean_rgb = rgb.mean(axis=(0, 1))
    std_rgb = rgb.std(axis=(0, 1))
    mean_hsv = hsv.mean(axis=(0, 1))
    std_hsv = hsv.std(axis=(0, 1))

    edges = cv2.Canny(gray, 60, 150)
    edge_density = float(np.count_nonzero(edges)) / float(edges.size)

    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    thresh = cv2.threshold(
        gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
    )[1]
    lesion_ratio = float(np.count_nonzero(thresh)) / float(thresh.size)

    redness_ratio = float(mean_rgb[0]) / float(mean_rgb[1] + mean_rgb[2] + 1.0)
    saturation = float(mean_hsv[1])
    brightness = float(mean_hsv[2])

    hog_input = cv2.resize(gray, (48, 48))
    hog = cv2.HOGDescriptor(
        _winSize=(48, 48),
        _blockSize=(16, 16),
        _blockStride=(16, 16),
        _cellSize=(8, 8),
        _nbins=9,
    )
    hog_features = hog.compute(hog_input).flatten()

    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    local_binary = np.zeros_like(blur, dtype=np.uint8)
    center = blur[1:-1, 1:-1]
    neighbors = [
        blur[:-2, :-2], blur[:-2, 1:-1], blur[:-2, 2:],
        blur[1:-1, 2:], blur[2:, 2:], blur[2:, 1:-1],
        blur[2:, :-2], blur[1:-1, :-2],
    ]
    for idx, neighbor in enumerate(neighbors):
        local_binary[1:-1, 1:-1] |= ((neighbor >= center) << idx).astype(np.uint8)
    lbp_hist, _ = np.histogram(local_binary[1:-1, 1:-1], bins=32, range=(0, 256))
    lbp_hist = lbp_hist.astype(np.float32)
    lbp_hist = lbp_hist / (lbp_hist.sum() + 1e-9)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    largest_contour_area = max((cv2.contourArea(contour) for contour in contours), default=0.0)
    hu_moments = cv2.HuMoments(cv2.moments(thresh)).flatten()
    hu_moments = np.sign(hu_moments) * np.log10(np.abs(hu_moments) + 1e-9)

    features.extend(mean_rgb.tolist())
    features.extend(std_rgb.tolist())
    features.extend(mean_hsv.tolist())
    features.extend(std_hsv.tolist())
    features.extend(
        [
            edge_density,
            lap_var,
            lesion_ratio,
            redness_ratio,
            saturation,
            brightness,
            largest_contour_area / float(thresh.size),
        ]
    )
    features.extend(hog_features.tolist())
    features.extend(lbp_hist.tolist())
    features.extend(hu_moments.tolist())

    return np.asarray(features, dtype=np.float32)


def load_trained_model():
    if not Path(SKIN_MODEL_PATH).exists():
        return None

    try:
        with open(SKIN_MODEL_PATH, "rb") as fh:
            payload = pickle.load(fh)
    except Exception:
        return None

    if not isinstance(payload, dict) or "model" not in payload or "classes" not in payload:
        return None

    return payload


_cnn_bundle = None


def get_cnn_transform():
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


def load_trained_cnn_model():
    global _cnn_bundle
    if _cnn_bundle is not None:
        return _cnn_bundle

    if not Path(SKIN_CNN_MODEL_PATH).exists():
        return None

    try:
        checkpoint = torch.load(SKIN_CNN_MODEL_PATH, map_location="cpu")
        class_names = checkpoint["classes"]
        architecture = checkpoint.get("architecture", "resnet18")

        if architecture != "resnet18":
            return None

        model = models.resnet18(weights=None)
        model.fc = torch.nn.Linear(model.fc.in_features, len(class_names))
        model.load_state_dict(checkpoint["state_dict"])
        model.eval()
        _cnn_bundle = {
            "model": model,
            "classes": class_names,
            "transform": get_cnn_transform(),
            "architecture": architecture,
        }
        return _cnn_bundle
    except Exception:
        return None


def build_fallback_scores(feature_vector):
    mean_r, mean_g, mean_b = feature_vector[96:99]
    std_r, std_g, std_b = feature_vector[99:102]
    edge_density = float(feature_vector[-6])
    lesion_ratio = float(feature_vector[-4])
    redness_ratio = float(feature_vector[-3])
    saturation = float(feature_vector[-2])
    brightness = float(feature_vector[-1])
    texture = float(std_r + std_g + std_b) / 3.0

    scores = {
        "acne": max(0.0, (redness_ratio - 0.36) * 3.0 + lesion_ratio * 1.8 + edge_density * 1.4),
        "fungal_infection": max(0.0, lesion_ratio * 1.6 + saturation / 255.0 * 1.2 + edge_density),
        "normal_skin": max(0.0, 1.6 - lesion_ratio * 2.2 - edge_density * 1.5 + (brightness / 255.0) * 0.4),
        "wound_normal": max(0.0, redness_ratio * 1.8 + texture / 255.0 + lesion_ratio * 1.2),
        "wound_infected": max(0.0, redness_ratio * 2.1 + saturation / 255.0 * 1.3 + lesion_ratio * 1.5),
    }

    total = sum(scores.values()) + 1e-9
    return {label: round(value / total, 4) for label, value in scores.items()}


def to_response(predicted, probabilities, *, model_source):
    dataset_info = load_dataset_info()
    confidence_pct = round(float(probabilities[predicted]) * 100, 1)

    return {
        "condition": predicted,
        "label": CONDITION_LABELS.get(predicted, predicted.replace("_", " ").title()),
        "description": CONDITION_DESCRIPTIONS.get(
            predicted,
            "Image pattern matched this class more strongly than the available alternatives.",
        ),
        "confidence": confidence_pct,
        "probabilities": {
            CONDITION_LABELS.get(label, label.replace("_", " ").title()): round(prob * 100, 1)
            for label, prob in sorted(probabilities.items(), key=lambda item: item[1], reverse=True)
        },
        "model_source": model_source,
        "dataset": dataset_info,
    }


def classify_image(image_bytes):
    cnn_bundle = load_trained_cnn_model()
    if cnn_bundle is not None:
        img = pil_image_from_bytes(image_bytes)
        tensor = cnn_bundle["transform"](img).unsqueeze(0)
        with torch.no_grad():
            logits = cnn_bundle["model"](tensor)
            probs = torch.softmax(logits, dim=1)[0].cpu().numpy()
        probabilities = {
            label: float(probs[idx]) for idx, label in enumerate(cnn_bundle["classes"])
        }
        predicted = max(probabilities, key=probabilities.get)
        return to_response(predicted, probabilities, model_source="trained_cnn")

    features = extract_image_features(image_bytes)
    trained = load_trained_model()

    if trained is not None:
        model = trained["model"]
        classes = trained["classes"]
        raw_probs = model.predict_proba([features])[0]
        probabilities = {
            label: float(raw_probs[idx]) for idx, label in enumerate(classes)
        }
        predicted = max(probabilities, key=probabilities.get)
        return to_response(predicted, probabilities, model_source="trained_model")

    probabilities = build_fallback_scores(features)
    predicted = max(probabilities, key=probabilities.get)
    return to_response(predicted, probabilities, model_source="fallback_rules")
