# AI Datasets And Model Status

## Current Status

- Skin detection model:
  - Bundled real dataset: no
  - Bundled trained model: no
  - Repo behavior without training: fallback rules

- Symptom prediction model:
  - Bundled real clinical dataset: no
  - Bundled trained model: no
  - Repo behavior without training: synthetic demo model built from hardcoded symptom mappings

## Dataset Locations

- Skin images:
  - `artifacts/ai-backend/artifacts/datasets/skin_conditions`

- Symptom CSV:
  - `artifacts/ai-backend/artifacts/datasets/symptom_clinical/symptom_cases.csv`

## Training Commands

Skin model:

```powershell
python artifacts/ai-backend/ml/train_image_model.py
```

Symptom model:

```powershell
python artifacts/ai-backend/ml/train_symptom_model.py
```

## After Training

Restart Flask:

```powershell
python artifacts/ai-backend/app.py
```

The frontend will then show whether predictions come from:

- `Trained model` / `Trained clinical dataset`
- or demo/fallback logic
