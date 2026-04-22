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

        from ml.guidance_data import KNOWN_MEDICINES, MEDICINE_INFO
        text_lower = extracted_text.lower()
        detected_medicines = []
        for med in KNOWN_MEDICINES:
            if med in text_lower:
                detected_medicines.append(med.title())

        detected_medicines = list(dict.fromkeys(detected_medicines))

        medicine_details = []
        for med in detected_medicines:
            key = med.lower()
            info = MEDICINE_INFO.get(key, {})
            medicine_details.append({
                "name": med,
                "category": info.get("category", "Medicine"),
                "uses": info.get("uses", "Please consult your doctor or pharmacist for details about this medicine."),
                "precautions": info.get("precautions", "Always follow your doctor's instructions. Do not self-medicate."),
            })

        return jsonify({
            "extracted_text": extracted_text.strip(),
            "detected_medicines": detected_medicines,
            "medicine_details": medicine_details,
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


# ---------------------------------------------------------------------------
# 8. Global AI Assistant (Robot Guide with smart action suggestions)
# ---------------------------------------------------------------------------
@app.route("/ai-api/assistant", methods=["POST"])
def assistant():
    try:
        data = request.get_json(force=True)
        message = (data.get("message") or "").strip()
        preferred_lang = (data.get("language") or "").strip()

        if not message:
            return jsonify({"error": "Please send a message"}), 400

        from ml.chatbot_data import detect_language, DISCLAIMER as CHAT_DISCLAIMER

        lang = preferred_lang if preferred_lang in ("en", "hi", "od") else detect_language(message)
        msg_lower = message.lower()

        GREETINGS_KW = {
            "en": ["hello", "hi", "hey", "help", "start", "what can you do", "guide me"],
            "hi": ["नमस्ते", "हैलो", "हाय", "मदद", "शुरू", "क्या कर सकते हो"],
            "od": ["ନମସ୍କାର", "ହ୍ୟାଲୋ", "ସାହାଯ୍ୟ", "ଶୁରୁ"],
        }
        SYMPTOM_KW = ["symptom", "sick", "fever", "pain", "cough", "headache", "feel", "ill", "unwell",
                      "लक्षण", "बीमार", "बुखार", "दर्द", "खांसी", "अस्वस्थ",
                      "ଲକ୍ଷଣ", "ଅସୁସ୍ଥ", "ଜ୍ୱର", "ଯନ୍ତ୍ରଣା", "ଦ୍ରଦ"]
        IMAGE_KW = ["image", "photo", "picture", "upload", "skin", "wound", "rash", "acne",
                    "फोटो", "त्वचा", "घाव", "चित्र",
                    "ଫଟୋ", "ଚର୍ମ", "ଘା", "ଛବି"]
        PRESCRIPTION_KW = ["prescription", "medicine", "tablet", "scan", "ocr", "drug", "pill",
                           "पर्चा", "दवाई", "टैबलेट", "स्कैन",
                           "ଔଷଧ", "ପ୍ରେସ୍କ୍ରିପ୍ସନ", "ଟ୍ୟାବ୍ଲେଟ"]
        DOCTOR_KW = ["doctor", "specialist", "hospital", "find", "appointment", "consult",
                     "डॉक्टर", "विशेषज्ञ", "अस्पताल", "अपॉइंटमेंट",
                     "ଡାକ୍ତର", "ବିଶେଷଜ୍ଞ", "ଅସ୍ପତାଳ"]
        EMERGENCY_KW = ["emergency", "ambulance", "urgent", "accident", "help", "critical", "108",
                        "आपातकाल", "एम्बुलेंस", "तत्काल", "दुर्घटना",
                        "ଜରୁରୀ", "ଏମ୍ବୁଲ୍ୟାନ୍ସ", "ଆପ ଦ୍ୱାତ"]
        HOME_CARE_KW = ["home", "remedy", "home care", "treatment", "care", "remedies",
                        "घरेलू", "उपचार", "घर",
                        "ଘରୋଇ", "ଉପଚାର"]

        intent = "greeting"
        action = None
        action_url = None

        all_greetings = []
        for g_list in GREETINGS_KW.values():
            all_greetings.extend(g_list)
        if any(kw in msg_lower for kw in all_greetings):
            intent = "greeting"
        elif any(kw in msg_lower for kw in EMERGENCY_KW):
            intent = "emergency"
            action = {"en": "Book Ambulance", "hi": "एम्बुलेंस बुक करें", "od": "ଏମ୍ବୁଲ୍ୟାନ୍ସ ବୁକ"}[lang]
            action_url = "/book"
        elif any(kw in msg_lower for kw in SYMPTOM_KW):
            intent = "symptom_check"
            action = {"en": "Check Symptoms", "hi": "लक्षण जांचें", "od": "ଲକ୍ଷଣ ଯାଞ୍ଚ"}[lang]
            action_url = "/ai/symptom-checker"
        elif any(kw in msg_lower for kw in PRESCRIPTION_KW):
            intent = "prescription"
            action = {"en": "Scan Prescription", "hi": "पर्चा स्कैन करें", "od": "ପ୍ରେସ୍କ୍ରିପ୍ସନ ସ୍କ୍ୟାନ"}[lang]
            action_url = "/ai/prescription-scanner"
        elif any(kw in msg_lower for kw in IMAGE_KW):
            intent = "image_detect"
            action = {"en": "Upload Image", "hi": "फोटो अपलोड करें", "od": "ଫଟୋ ଅପଲୋଡ"}[lang]
            action_url = "/ai/image-detect"
        elif any(kw in msg_lower for kw in DOCTOR_KW):
            intent = "find_doctor"
            action = {"en": "Find Specialist", "hi": "विशेषज्ञ खोजें", "od": "ବିଶେଷଜ୍ଞ ଖୋଜ"}[lang]
            action_url = "/ai/specialist"
        elif any(kw in msg_lower for kw in HOME_CARE_KW):
            intent = "home_care"
            action = {"en": "Home Care Guide", "hi": "घरेलू देखभाल", "od": "ଘରୋଇ ଚିକିତ୍ସା"}[lang]
            action_url = "/ai/home-care"

        RESPONSES = {
            "greeting": {
                "en": "Hello! I'm your MediTech health guide 🤖\n\nI can help you:\n• Check your symptoms\n• Upload a skin or wound photo\n• Scan a prescription\n• Find the right doctor\n• Book an ambulance in emergencies\n\nWhat would you like to do today?",
                "hi": "नमस्ते! मैं आपका MediTech स्वास्थ्य गाइड हूँ 🤖\n\nमैं आपकी मदद कर सकता हूँ:\n• लक्षण जांच\n• त्वचा या घाव की फोटो अपलोड\n• पर्चा स्कैन\n• सही डॉक्टर खोजें\n• आपातकाल में एम्बुलेंस बुक करें\n\nआज आप क्या करना चाहते हैं?",
                "od": "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ MediTech ସ୍ୱାସ୍ଥ୍ୟ ଗାଇଡ 🤖\n\nମୁଁ ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିପାରିବି:\n• ଲକ୍ଷଣ ଯାଞ୍ଚ\n• ଚର୍ମ ବା ଘା ଫଟୋ\n• ପ୍ରେସ୍କ୍ରିପ୍ସନ ସ୍କ୍ୟାନ\n• ଡାକ୍ତର ଖୋଜ\n• ଜରୁରୀ ଏମ୍ବୁଲ୍ୟାନ୍ସ\n\nଆଜି ଆପଣ କ'ଣ କରିବାକୁ ଚାହୁଁଛନ୍ତି?",
            },
            "symptom_check": {
                "en": "I see you may have some symptoms. Let me guide you to the Symptom Checker.\n\nPlease click the button below to select your symptoms and get an AI-based prediction. It's quick and simple!",
                "hi": "लगता है आपको कुछ लक्षण हैं। मैं आपको Symptom Checker तक ले जाता हूँ।\n\nनीचे दिए बटन को दबाएं, अपने लक्षण चुनें और AI से भविष्यवाणी पाएं। यह आसान है!",
                "od": "ଆପଣଙ୍କ କିଛି ଲକ୍ଷଣ ଥିବା ଦେଖୁଛି। ଆପଣଙ୍କୁ Symptom Checker ପାଖୁ ନେଇ ଯାଏ।\n\nନିମ୍ନ ବଟନ ଦବାଇ ଆପଣଙ୍କ ଲକ୍ଷଣ ଚୟନ କରନ୍ତୁ।",
            },
            "image_detect": {
                "en": "I can help analyze a skin or wound photo for you.\n\nPlease click below to go to the Image Analysis tool. Upload a clear photo of the affected area and our AI will identify the condition.",
                "hi": "मैं आपकी त्वचा या घाव की फोटो का विश्लेषण कर सकता हूँ।\n\nनीचे दिए बटन से Image Analysis tool पर जाएं। प्रभावित हिस्से की स्पष्ट फोटो अपलोड करें।",
                "od": "ମୁଁ ଆପଣଙ୍କ ଚର୍ମ ବା ଘା ଫଟୋ ବିଶ୍ଲେଷଣ ସାହାଯ୍ୟ କରିବି।\n\nନିମ୍ନ ବଟନ ଦ୍ୱାରା Image Analysis ଟୁଲ ଦେଖନ୍ତୁ।",
            },
            "prescription": {
                "en": "I can scan your prescription and identify medicines.\n\nPlease click below to go to the Prescription Scanner. Take a clear photo of your prescription and upload it.",
                "hi": "मैं आपका prescription scan कर के दवाइयां पहचान सकता हूँ।\n\nनीचे दिए बटन से Prescription Scanner पर जाएं। अपने पर्चे की साफ फोटो खींचकर अपलोड करें।",
                "od": "ମୁଁ ଆପଣଙ୍କ ପ୍ରେସ୍କ୍ରିପ୍ସନ ସ୍କ୍ୟାନ କରି ଔଷଧ ଚିହ୍ନଟ ସାହାଯ୍ୟ କରିବି।\n\nନିମ୍ନ ବଟନ ଦ୍ୱାରା Prescription Scanner ଦେଖନ୍ତୁ।",
            },
            "find_doctor": {
                "en": "Let me help you find the right specialist.\n\nClick below to use the Specialist Finder. Enter your condition and I will suggest the right type of doctor for you.",
                "hi": "मैं आपको सही विशेषज्ञ खोजने में मदद करूंगा।\n\nनीचे Specialist Finder पर जाएं। अपनी बीमारी डालें और सही डॉक्टर खोजें।",
                "od": "ମୁଁ ଆପଣଙ୍କ ଠିକ ବିଶେଷଜ୍ଞ ଖୋଜିବାରେ ସାହାଯ୍ୟ କରିବି।\n\nନିମ୍ନ Specialist Finder ରେ ଆପଣଙ୍କ ରୋଗ ଦଖଲ କରନ୍ତୁ।",
            },
            "home_care": {
                "en": "I can show you home remedies and care guidance.\n\nClick below to go to the Home Care section. Search for your condition to get home remedies and doctor visit advice.",
                "hi": "मैं आपको घरेलू उपचार और देखभाल की जानकारी दे सकता हूँ।\n\nHome Care section में जाएं। अपनी बीमारी खोजें और घरेलू उपचार पाएं।",
                "od": "ମୁଁ ଆପଣଙ୍କ ଘରୋଇ ଚିକିତ୍ସା ଓ ଯତ୍ନ ଗାଇଡ ଦେଖାଇ ପାରିବି।\n\nHome Care ବିଭାଗ ଦେଖନ୍ତୁ।",
            },
            "emergency": {
                "en": "🚨 EMERGENCY DETECTED!\n\nPlease call 108 for an ambulance immediately.\n\nOr click below to book an ambulance through this app right now. Stay calm and stay on the line.",
                "hi": "🚨 आपातकाल!\n\nकृपया तुरंत 108 पर एम्बुलेंस के लिए कॉल करें।\n\nया नीचे दिए बटन से अभी एम्बुलेंस बुक करें। शांत रहें।",
                "od": "🚨 ଜରୁରୀ!\n\nଦୟାକରି ତୁରନ୍ତ 108 ଡ଼ାକନ୍ତୁ।\n\nଅଥବା ନିମ୍ନ ବଟନ ଦ୍ୱାରା ଏମ୍ବୁଲ୍ୟାନ୍ସ ବୁକ କରନ୍ତୁ।",
            },
        }

        response_text = RESPONSES.get(intent, RESPONSES["greeting"])[lang]

        if intent not in ("greeting", "emergency"):
            response_text += "\n\n— " + CHAT_DISCLAIMER[lang]

        quick_actions = [
            {"label": {"en": "Check Symptoms", "hi": "लक्षण जांचें", "od": "ଲକ୍ଷଣ ଯାଞ୍ଚ"}[lang], "url": "/ai/symptom-checker"},
            {"label": {"en": "Upload Image", "hi": "फोटो अपलोड करें", "od": "ଫଟୋ ଅପଲୋଡ"}[lang], "url": "/ai/image-detect"},
            {"label": {"en": "Scan Prescription", "hi": "पर्चा स्कैन करें", "od": "ପ୍ରେସ୍କ୍ରିପ୍ସନ ସ୍କ୍ୟାନ"}[lang], "url": "/ai/prescription-scanner"},
            {"label": {"en": "Find Doctor", "hi": "डॉक्टर खोजें", "od": "ଡାକ୍ତର ଖୋଜ"}[lang], "url": "/ai/specialist"},
            {"label": {"en": "Emergency Help", "hi": "आपातकालीन सहायता", "od": "ଜରୁରୀ ସାହାଯ୍ୟ"}[lang], "url": "/book"},
        ]

        return jsonify({
            "response": response_text,
            "detected_language": lang,
            "intent": intent,
            "action_label": action,
            "action_url": action_url,
            "quick_actions": quick_actions,
            "urgency": "high" if intent == "emergency" else "low",
        })

    except Exception as e:
        logger.error(f"Assistant error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
