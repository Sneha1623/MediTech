import io
import numpy as np
from PIL import Image, ImageStat

CONDITIONS = ["acne", "fungal_infection", "normal_skin", "wound_normal", "wound_infected"]

CONDITION_LABELS = {
    "acne": "Acne",
    "fungal_infection": "Fungal Infection",
    "normal_skin": "Normal Skin",
    "wound_normal": "Wound (Normal)",
    "wound_infected": "Wound (Infected)",
}

CONDITION_DESCRIPTIONS = {
    "acne": "Possible acne detected. Characterized by reddish spots, often with raised texture.",
    "fungal_infection": "Possible fungal infection. Irregular patches with brownish-yellow discoloration.",
    "normal_skin": "Skin appears normal with even tone and no obvious lesions detected.",
    "wound_normal": "A wound is detected. The wound appears clean without signs of major infection.",
    "wound_infected": "A wound with possible infection signs detected. Yellowish or darkened edges may indicate infection.",
}


def extract_image_features(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((128, 128))
        stat = ImageStat.Stat(img)

        mean_r, mean_g, mean_b = stat.mean
        std_r, std_g, std_b = stat.stddev

        arr = np.array(img, dtype=float)

        # Compute redness ratio
        redness = mean_r / (mean_g + mean_b + 1)

        # Yellowish-brown component
        yellowness = (mean_r + mean_g) / (2 * (mean_b + 1))

        # Texture complexity (standard deviation across channels)
        texture = (std_r + std_g + std_b) / 3

        # Darkness factor
        brightness = (mean_r + mean_g + mean_b) / 3

        return {
            "mean_r": mean_r,
            "mean_g": mean_g,
            "mean_b": mean_b,
            "std_r": std_r,
            "std_g": std_g,
            "std_b": std_b,
            "redness": redness,
            "yellowness": yellowness,
            "texture": texture,
            "brightness": brightness,
        }
    except Exception as e:
        raise ValueError(f"Image processing error: {str(e)}")


def classify_image(image_bytes):
    features = extract_image_features(image_bytes)

    redness = features["redness"]
    yellowness = features["yellowness"]
    texture = features["texture"]
    brightness = features["brightness"]
    mean_b = features["mean_b"]

    scores = {
        "acne": 0.0,
        "fungal_infection": 0.0,
        "normal_skin": 0.0,
        "wound_normal": 0.0,
        "wound_infected": 0.0,
    }

    # Acne: reddish with moderate texture
    scores["acne"] = (redness - 1.0) * 0.6 + (texture / 60) * 0.4
    if scores["acne"] < 0:
        scores["acne"] = 0

    # Fungal infection: yellowish-brown with irregular patches
    scores["fungal_infection"] = (yellowness - 1.0) * 0.5 + (texture / 50) * 0.3
    if mean_b > 130:
        scores["fungal_infection"] *= 0.5

    # Normal skin: balanced colors, moderate brightness
    balance = 1.0 - abs(features["mean_r"] - features["mean_g"]) / 255 - abs(features["mean_g"] - features["mean_b"]) / 255
    scores["normal_skin"] = balance * 0.7 + (1.0 - texture / 100) * 0.3
    if brightness < 80 or brightness > 230:
        scores["normal_skin"] *= 0.5

    # Wound normal: reddish center, moderate area
    scores["wound_normal"] = redness * 0.4 + (1 - yellowness / 3) * 0.3 + (texture / 70) * 0.3

    # Wound infected: reddish + yellowish (pus) + dark edges
    scores["wound_infected"] = redness * 0.3 + yellowness * 0.4 + (texture / 80) * 0.3
    if brightness > 180:
        scores["wound_infected"] *= 0.6

    total = sum(scores.values()) + 1e-9
    probabilities = {k: round(v / total, 3) for k, v in scores.items()}

    predicted = max(probabilities, key=probabilities.get)

    confidence_pct = round(probabilities[predicted] * 100, 1)

    # Add some realistic randomness for demo purposes
    rng = np.random.default_rng(int(redness * 100 + texture * 10) % 99999)
    noise = rng.uniform(-0.05, 0.05, len(CONDITIONS))
    for i, cond in enumerate(CONDITIONS):
        probabilities[cond] = max(0, min(1, probabilities[cond] + noise[i]))

    total2 = sum(probabilities.values()) + 1e-9
    probabilities = {k: round(v / total2, 3) for k, v in probabilities.items()}
    predicted = max(probabilities, key=probabilities.get)
    confidence_pct = round(probabilities[predicted] * 100, 1)

    return {
        "condition": predicted,
        "label": CONDITION_LABELS[predicted],
        "description": CONDITION_DESCRIPTIONS[predicted],
        "confidence": confidence_pct,
        "probabilities": {CONDITION_LABELS[c]: round(probabilities[c] * 100, 1) for c in CONDITIONS},
    }
