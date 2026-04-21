import os
import sys
import json
import logging

from flask import Flask, request, jsonify
from flask_cors import CORS

sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

DISCLAIMER = "This system provides preliminary guidance and is not a medical diagnosis. Always consult a qualified healthcare professional for medical advice."

# ---------------------------------------------------------------------------
# Lazy-loaded symptom model
# ---------------------------------------------------------------------------
_symptom_model = None
_symptom_label_encoder = None

def get_symptom_model():
    global _symptom_model, _symptom_label_encoder
    if _symptom_model is None:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import LabelEncoder
        from ml.symptom_data import generate_training_data, SYMPTOMS, DISEASES

        logger.info("Training symptom prediction model...")
        X, y = generate_training_data(samples_per_disease=50)
        le = LabelEncoder()
        y_enc = le.fit_transform(y)
        clf = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
        clf.fit(X, y_enc)
        _symptom_model = clf
        _symptom_label_encoder = le
        logger.info("Symptom model trained successfully.")
    return _symptom_model, _symptom_label_encoder


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.route("/ai-api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "MediTech AI Backend"})


# ---------------------------------------------------------------------------
# 1. Symptom-based disease prediction
# ---------------------------------------------------------------------------
@app.route("/ai-api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        symptoms_input = data.get("symptoms", [])

        if not symptoms_input or not isinstance(symptoms_input, list):
            return jsonify({"error": "Please provide a list of symptoms"}), 400

        from ml.symptom_data import SYMPTOMS as ALL_SYMPTOMS

        symptoms_input_lower = [s.lower().replace(" ", "_") for s in symptoms_input]

        feature_vector = [1 if s in symptoms_input_lower else 0 for s in ALL_SYMPTOMS]

        if sum(feature_vector) == 0:
            return jsonify({"error": "No recognized symptoms found. Please check symptom names."}), 400

        clf, le = get_symptom_model()

        proba = clf.predict_proba([feature_vector])[0]
        top3_idx = proba.argsort()[-3:][::-1]

        top_predictions = []
        for idx in top3_idx:
            disease = le.inverse_transform([idx])[0]
            confidence = round(float(proba[idx]) * 100, 1)
            top_predictions.append({"disease": disease, "confidence": confidence})

        primary = top_predictions[0]

        from ml.guidance_data import SPECIALIST_MAP
        specialist = SPECIALIST_MAP.get(primary["disease"], "General Physician")

        return jsonify({
            "predicted_disease": primary["disease"],
            "confidence": primary["confidence"],
            "top_predictions": top_predictions,
            "recommended_specialist": specialist,
            "disclaimer": DISCLAIMER,
            "symptoms_analyzed": [ALL_SYMPTOMS[i] for i, v in enumerate(feature_vector) if v == 1],
        })

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# 2. Skin / Face / Wound Image Detection
# ---------------------------------------------------------------------------
@app.route("/ai-api/image-detect", methods=["POST"])
def image_detect():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file uploaded. Use key 'image'"}), 400

        file = request.files["image"]
        image_bytes = file.read()

        if len(image_bytes) == 0:
            return jsonify({"error": "Empty file uploaded"}), 400

        from ml.image_model import classify_image
        from ml.guidance_data import CONDITION_SPECIALIST_MAP

        result = classify_image(image_bytes)
        specialist = CONDITION_SPECIALIST_MAP.get(result["condition"], "General Physician")

        return jsonify({
            "condition": result["condition"],
            "label": result["label"],
            "description": result["description"],
            "confidence": result["confidence"],
            "probabilities": result["probabilities"],
            "recommended_specialist": specialist,
            "disclaimer": DISCLAIMER,
        })

    except Exception as e:
        logger.error(f"Image detection error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# 3. Home Care Guidance
# ---------------------------------------------------------------------------
@app.route("/ai-api/guidance", methods=["POST"])
def guidance():
    try:
        data = request.get_json(force=True)
        disease = data.get("disease", "").strip()

        if not disease:
            return jsonify({"error": "Please provide a disease name"}), 400

        from ml.guidance_data import GUIDANCE, SPECIALIST_MAP

        matched = None
        for key in GUIDANCE:
            if key.lower() == disease.lower():
                matched = key
                break

        if not matched:
            for key in GUIDANCE:
                if disease.lower() in key.lower() or key.lower() in disease.lower():
                    matched = key
                    break

        if not matched:
            return jsonify({
                "error": f"No guidance found for '{disease}'",
                "available_diseases": list(GUIDANCE.keys()),
                "disclaimer": DISCLAIMER,
            }), 404

        info = GUIDANCE[matched]
        specialist = SPECIALIST_MAP.get(matched, "General Physician")

        return jsonify({
            "disease": matched,
            "home_remedies": info["home_remedies"],
            "when_to_visit_doctor": info["when_to_visit_doctor"],
            "emergency_warning": info["emergency_warning"],
            "recommended_specialist": specialist,
            "disclaimer": DISCLAIMER,
        })

    except Exception as e:
        logger.error(f"Guidance error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# 4. Prescription Scanner (OCR)
# ---------------------------------------------------------------------------
@app.route("/ai-api/scan-prescription", methods=["POST"])
def scan_prescription():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file uploaded. Use key 'image'"}), 400

        file = request.files["image"]
        image_bytes = file.read()

        if len(image_bytes) == 0:
            return jsonify({"error": "Empty file uploaded"}), 400

        from PIL import Image
        import io

        img = Image.open(io.BytesIO(image_bytes))

        extracted_text = ""
        ocr_available = False

        try:
            import pytesseract
            extracted_text = pytesseract.image_to_string(img, config="--psm 6")
            ocr_available = True
        except ImportError:
            extracted_text = "[Tesseract OCR not installed — install pytesseract and tesseract-ocr for full functionality]"
        except Exception as ocr_err:
            extracted_text = f"[OCR processing failed: {str(ocr_err)}]"

        from ml.guidance_data import KNOWN_MEDICINES
        text_lower = extracted_text.lower()
        detected_medicines = []
        for med in KNOWN_MEDICINES:
            if med in text_lower:
                detected_medicines.append(med.title())

        detected_medicines = list(dict.fromkeys(detected_medicines))

        return jsonify({
            "extracted_text": extracted_text.strip(),
            "detected_medicines": detected_medicines,
            "medicines_count": len(detected_medicines),
            "ocr_available": ocr_available,
            "disclaimer": DISCLAIMER,
        })

    except Exception as e:
        logger.error(f"Prescription scan error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# 5. Specialist Recommendation
# ---------------------------------------------------------------------------
@app.route("/ai-api/specialist", methods=["POST"])
def specialist_recommendation():
    try:
        data = request.get_json(force=True)
        disease = data.get("disease", "").strip()
        condition = data.get("condition", "").strip()

        from ml.guidance_data import SPECIALIST_MAP, CONDITION_SPECIALIST_MAP

        specialist = None
        source = None

        if disease:
            for key in SPECIALIST_MAP:
                if key.lower() == disease.lower() or disease.lower() in key.lower():
                    specialist = SPECIALIST_MAP[key]
                    source = key
                    break

        if not specialist and condition:
            for key in CONDITION_SPECIALIST_MAP:
                if key.lower() == condition.lower() or condition.lower() in key.lower():
                    specialist = CONDITION_SPECIALIST_MAP[key]
                    source = key
                    break

        if not specialist:
            keyword = (disease or condition).lower()
            if any(w in keyword for w in ["skin", "rash", "acne", "itch"]):
                specialist = "Dermatologist"
            elif any(w in keyword for w in ["wound", "cut", "injury", "fracture", "bone"]):
                specialist = "General Surgeon / Orthopedic Surgeon"
            elif any(w in keyword for w in ["heart", "chest", "blood pressure"]):
                specialist = "Cardiologist"
            elif any(w in keyword for w in ["lung", "breath", "cough", "tb"]):
                specialist = "Pulmonologist"
            elif any(w in keyword for w in ["stomach", "gut", "liver", "digestive"]):
                specialist = "Gastroenterologist"
            elif any(w in keyword for w in ["sugar", "diabetes", "thyroid"]):
                specialist = "Endocrinologist"
            elif any(w in keyword for w in ["mental", "anxiety", "depression", "stress"]):
                specialist = "Psychiatrist / Psychologist"
            else:
                specialist = "General Physician"

        return jsonify({
            "recommended_specialist": specialist,
            "matched_condition": source,
            "query": disease or condition,
            "disclaimer": DISCLAIMER,
        })

    except Exception as e:
        logger.error(f"Specialist recommendation error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# List all available symptoms
# ---------------------------------------------------------------------------
@app.route("/ai-api/symptoms", methods=["GET"])
def list_symptoms():
    from ml.symptom_data import SYMPTOMS, DISEASES
    return jsonify({"symptoms": SYMPTOMS, "diseases": DISEASES})


# ---------------------------------------------------------------------------
# 6. AI Chatbot (multilingual, elderly-friendly)
# ---------------------------------------------------------------------------
@app.route("/ai-api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True)
        message = (data.get("message") or "").strip()
        preferred_lang = data.get("language", "").strip()

        if not message:
            return jsonify({"error": "Please send a message"}), 400

        from ml.chatbot_data import (
            detect_language, match_intent,
            GREETING_RESPONSES, SYMPTOM_KEYWORDS, DEFAULT_RESPONSES, DISCLAIMER
        )

        lang = preferred_lang if preferred_lang in ("en", "hi", "od") else detect_language(message)
        intent, matched_symptom = match_intent(message)

        response_text = ""
        urgency = "low"
        related_symptom_keys = []

        if intent == "greeting":
            response_text = GREETING_RESPONSES[lang]
        elif intent == "symptom" and matched_symptom:
            symptom_data = SYMPTOM_KEYWORDS[matched_symptom]
            response_text = symptom_data["response"][lang]
            urgency = symptom_data.get("urgency", "low")
            related_symptom_keys = [matched_symptom]
        else:
            response_text = DEFAULT_RESPONSES[lang]

        if intent != "greeting":
            response_text += "\n\n— " + DISCLAIMER[lang]

        follow_ups = {
            "en": ["Check home care guidance", "Find a specialist", "Symptom checker"],
            "hi": ["घरेलू उपचार देखें", "विशेषज्ञ खोजें", "लक्षण जांच"],
            "od": ["ଘରୋଇ ଚିକିତ୍ସା ଦେଖନ୍ତୁ", "ବିଶେଷଜ୍ଞ ଖୋଜନ୍ତୁ", "ଲକ୍ଷଣ ଯାଞ୍ଚ"],
        }

        return jsonify({
            "response": response_text,
            "detected_language": lang,
            "intent": intent,
            "matched_condition": matched_symptom,
            "urgency": urgency,
            "follow_up_suggestions": follow_ups[lang],
        })

    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# 7. Translation endpoint
# ---------------------------------------------------------------------------
@app.route("/ai-api/translate", methods=["POST"])
def translate():
    try:
        data = request.get_json(force=True)
        term = (data.get("term") or "").strip().lower()
        target_lang = data.get("target_lang", "en").strip()

        from ml.chatbot_data import TRANSLATIONS

        if target_lang not in ("en", "hi", "od"):
            return jsonify({"error": "Supported languages: en, hi, od"}), 400

        translations = {}
        for key, val in TRANSLATIONS.items():
            if term in key.lower() or term in val.get("en", "").lower():
                translations[key] = val

        if not translations:
            return jsonify({"translated": term, "note": "Term not found in dictionary", "available_terms": list(TRANSLATIONS.keys())})

        best_key = list(translations.keys())[0]
        translated = translations[best_key][target_lang]

        return jsonify({
            "original": term,
            "translated": translated,
            "target_language": target_lang,
            "all_translations": translations[best_key],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
