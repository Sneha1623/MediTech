# MediTech — Smart Healthcare Management System

> A unified platform for Indian hospitals to track critical resources, deploy ambulance fleets, predict emergency hotspots, and provide AI-powered health guidance — in English, Hindi, and Odia.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Multilingual Support](#multilingual-support)
- [AI Assistant](#ai-assistant)
- [Disclaimer](#disclaimer)

---

## Overview

MediTech is a comprehensive full-stack healthcare management system designed for Indian hospitals and patients. It provides real-time hospital resource monitoring, emergency ambulance dispatch, AI-assisted health diagnosis, and a multilingual guided assistant — all in one platform.

---

## Features

### Hospital & Resource Management
- Real-time dashboard for ICU beds, general beds, oxygen cylinders, and ventilators
- Hospital directory with searchable, detailed views
- Resource tracking across all networked hospitals

### Emergency Response
- One-click ambulance booking with emergency level selection (Critical / Moderate / Low)
- Live emergency alerts system (broadcast and view system-wide alerts)
- Predictive analytics for emergency hotspot identification

### AI Health Tools Hub
- **Symptom Checker** — Select symptoms and receive AI-based disease prediction with confidence scores
- **Skin & Wound Detection** — Upload a photo to identify skin conditions or wound types
- **Prescription Scanner (OCR)** — Scan a prescription image to extract text and identify medicines with detailed info:
  - Medicine name and category
  - Uses and indications
  - Precautions and warnings
- **Home Care Guidance** — Get home remedies, doctor visit advice, and emergency warnings for any condition
- **Specialist Finder** — Find the right specialist based on disease or condition
- **Health Chatbot** — Multilingual chat assistant with voice input/output

### Global AI Assistant (Robot Guide)
- Floating `🤖 AI Health Guide` button visible on every page
- Opens a chat panel with voice input (microphone) and text input
- Smart intent detection — understands what the user needs and suggests the right tool
- One-click navigation action buttons:
  - Check Symptoms
  - Upload Image
  - Scan Prescription
  - Find Doctor
  - Emergency Help
- Voice output using browser `speechSynthesis`
- Language indicator and switcher (EN / HI / OD)
- Elderly-friendly simple language and short sentences
- Disclaimer shown on every interaction

### Multilingual Support
All features support three languages:
- **English** (en)
- **Hindi** (hi) — हिंदी
- **Odia** (od) — ଓଡ଼ିଆ

Language is auto-detected and can be manually switched. Translations cover:
- Navigation and UI labels
- Chatbot responses and follow-up suggestions
- Home care guidance
- Specialist recommendations
- Emergency messages and disclaimers

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend (Vite)                 │
│  • All Pages  • Global AI Assistant (floating)          │
│  • i18n (EN/HI/OD)  • PWA Support                      │
└────────────────────┬────────────────────────────────────┘
                     │ REST API calls
          ┌──────────┴──────────┐
          │                     │
┌─────────▼──────────┐  ┌──────▼──────────────────────────┐
│  Node.js / Express │  │  Python / Flask (AI Backend)    │
│  API Server        │  │  /ai-api/*                       │
│  • Hospitals       │  │  • /assistant (Global Guide)    │
│  • Ambulances      │  │  • /chat (Health Chatbot)       │
│  • Bookings        │  │  • /predict (Symptom Check)     │
│  • Analytics       │  │  • /image-detect (Skin/Wound)   │
│  • Alerts          │  │  • /scan-prescription (OCR)     │
└────────────────────┘  │  • /guidance (Home Care)        │
          │             │  • /specialist                   │
          │             │  • /translate                    │
┌─────────▼──────────┐  └─────────────────────────────────┘
│   PostgreSQL DB    │
│  (Drizzle ORM)     │
└────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, Radix UI |
| Routing | Wouter |
| State / Data | TanStack Query (React Query) |
| Backend (API) | Node.js, Express 5, Drizzle ORM |
| Backend (AI) | Python 3, Flask, Flask-CORS |
| ML / AI | Scikit-learn (RandomForest), OpenCV, Pillow, Pytesseract |
| Database | PostgreSQL |
| Package Manager | pnpm (monorepo / workspaces) |
| PWA | vite-plugin-pwa |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |

---

## Project Structure

```
/
├── artifacts/
│   ├── meditech/               # React frontend (Vite)
│   │   └── src/
│   │       ├── components/
│   │       │   ├── global-assistant.tsx   # Floating AI Robot Guide
│   │       │   └── layout/
│   │       ├── pages/
│   │       │   ├── ai-chatbot.tsx
│   │       │   ├── symptom-checker.tsx
│   │       │   ├── image-detect.tsx
│   │       │   ├── prescription-scanner.tsx
│   │       │   ├── home-care.tsx
│   │       │   ├── specialist.tsx
│   │       │   └── ...
│   │       └── lib/
│   │           ├── i18n.tsx              # Language context
│   │           └── translations.ts       # EN/HI/OD translation dictionary
│   ├── api-server/             # Node.js Express backend
│   │   └── src/routes/
│   └── ai-backend/             # Python Flask AI backend
│       ├── app.py              # All AI/ML endpoints
│       └── ml/
│           ├── chatbot_data.py     # Multilingual chatbot data
│           ├── guidance_data.py    # Home care + medicine info
│           ├── image_model.py      # Skin/wound image classifier
│           └── symptom_data.py     # Disease/symptom training data
├── lib/
│   ├── db/                     # Drizzle schema + migrations
│   ├── api-spec/               # OpenAPI spec
│   └── api-client-react/       # Auto-generated React Query hooks
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL
- pnpm 9+

### Installation

```bash
# Install all dependencies
pnpm install

# Install Python dependencies for AI backend
pip install flask flask-cors scikit-learn pillow pytesseract opencv-python

# Set up environment variables
# DATABASE_URL=postgresql://...
```

### Running the Application

```bash
# Start the React frontend
pnpm --filter meditech dev

# Start the Node.js API server
pnpm --filter api-server dev

# Start the Python AI backend
python artifacts/ai-backend/app.py
```

### OCR Support (Prescription Scanner)

For full OCR functionality in the prescription scanner, install Tesseract:

```bash
# Ubuntu / Debian
sudo apt install tesseract-ocr

# macOS
brew install tesseract

# Then install the Python wrapper
pip install pytesseract
```

---

## API Reference

All AI endpoints are served at `/ai-api/`:

| Endpoint | Method | Description |
|---|---|---|
| `GET /ai-api/health` | GET | Service health check |
| `POST /ai-api/assistant` | POST | Global AI robot guide (intent detection + navigation) |
| `POST /ai-api/chat` | POST | Multilingual health chatbot |
| `POST /ai-api/predict` | POST | Symptom-based disease prediction |
| `POST /ai-api/image-detect` | POST | Skin/wound image classification |
| `POST /ai-api/scan-prescription` | POST | OCR prescription scanner + medicine details |
| `POST /ai-api/guidance` | POST | Home care guidance by disease |
| `POST /ai-api/specialist` | POST | Specialist doctor recommendation |
| `POST /ai-api/translate` | POST | Term translation (EN/HI/OD) |
| `GET /ai-api/symptoms` | GET | List all known symptoms and diseases |

### Assistant Endpoint Example

**POST /ai-api/assistant**
```json
{
  "message": "I feel sick and have a fever",
  "language": "en"
}
```

**Response:**
```json
{
  "response": "I see you may have some symptoms...",
  "detected_language": "en",
  "intent": "symptom_check",
  "action_label": "Check Symptoms",
  "action_url": "/ai/symptom-checker",
  "quick_actions": [...],
  "urgency": "low"
}
```

---

## Multilingual Support

The app supports three languages across all features:

| Feature | English | Hindi | Odia |
|---|---|---|---|
| UI Labels | ✅ | ✅ | ✅ |
| Chatbot responses | ✅ | ✅ | ✅ |
| Assistant guide | ✅ | ✅ | ✅ |
| Home care guidance | ✅ | ✅ | ✅ |
| Specialist names | ✅ | ✅ | ✅ |
| Emergency messages | ✅ | ✅ | ✅ |
| Voice input | ✅ | ✅ | ✅ (fallback EN voice) |
| Voice output | ✅ | ✅ | ✅ (fallback EN voice) |

Language is stored in `localStorage` and persists between sessions. The `document.lang` attribute is updated for accessibility.

---

## AI Assistant

The Global AI Assistant is a floating panel accessible from every page:

### How it Works
1. Click the **🤖 AI Health Guide** button (bottom-right corner of any page)
2. Type or speak your query in English, Hindi, or Odia
3. The assistant detects your intent and responds in your language
4. It suggests the right tool and provides a one-click navigation button
5. Use the quick action buttons to jump directly to any feature

### Supported Intents
| User says... | Assistant action |
|---|---|
| "I feel sick / I have a fever" | → Suggests Symptom Checker |
| "Upload image / skin problem" | → Suggests Image Detection |
| "Prescription / medicine / tablet" | → Suggests Prescription Scanner |
| "Doctor / specialist / hospital" | → Suggests Specialist Finder |
| "Emergency / ambulance / help" | → Books Ambulance (urgent) |
| "Home remedy / treatment" | → Suggests Home Care Guide |

### Voice Features
- **Voice Input**: Click the microphone button and speak your query
- **Voice Output**: Toggle the speaker icon to hear responses read aloud
- Supports EN-IN, HI-IN, OR-IN (Odia falls back to English voice if unavailable)

---

## Disclaimer

> This system provides general guidance and is **not** a medical diagnosis. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment. In emergencies, call **108** immediately.

---

## SDG Alignment

MediTech directly supports **UN Sustainable Development Goal 3: Good Health and Well-being** by:
- Reducing emergency response times
- Optimizing hospital resource allocation
- Providing accessible health guidance in local Indian languages
- Supporting elderly and non-English-speaking users

---

*Built for Indian hospitals. Designed for every Indian.*
