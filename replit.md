# Workspace

## Overview

pnpm workspace monorepo using TypeScript + Python. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (main), Flask 3 (AI backend)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI/ML**: scikit-learn (RandomForest), Pillow/OpenCV (image processing), pytesseract (OCR)

## AI Backend

The Python Flask AI backend lives in `artifacts/ai-backend/` and is served at `/ai-api/`.

### Endpoints
- `GET  /ai-api/health` — health check
- `POST /ai-api/predict` — symptom-based disease prediction (RandomForest ML)
- `POST /ai-api/image-detect` — skin/wound image detection (color-histogram based)
- `POST /ai-api/guidance` — home care guidance (dictionary-based)
- `POST /ai-api/scan-prescription` — OCR prescription scanner (pytesseract)
- `POST /ai-api/specialist` — specialist doctor recommendation
- `GET  /ai-api/symptoms` — list all available symptoms/diseases

### AI Frontend Pages
- `/ai` — AI Tools Hub
- `/ai/symptom-checker` — Symptom Checker
- `/ai/image-detect` — Skin & Wound Detection
- `/ai/home-care` — Home Care Guidance
- `/ai/prescription-scanner` — Prescription OCR Scanner
- `/ai/specialist` — Specialist Finder

### Python Environment
- Runtime: Python 3.11 (`.pythonlibs/` virtual env managed by uv)
- Key packages: flask, flask-cors, scikit-learn, numpy, Pillow, pytesseract, opencv-python-headless

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
