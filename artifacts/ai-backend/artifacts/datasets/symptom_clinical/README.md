# Symptom Prediction Dataset

This project does not bundle a real labeled clinical symptom dataset.

Place a CSV file named `symptom_cases.csv` in this directory with the following columns:

```csv
disease,symptoms
Influenza,"fever;cough;fatigue;body_ache;sore_throat"
Migraine,"headache;nausea;dizziness"
Urinary Tract Infection,"frequent_urination;back_pain;fever"
```

Requirements:

- `disease`: target diagnosis label.
- `symptoms`: semicolon-separated symptom names.
- Use normalized symptom names where possible, for example `shortness_of_breath`.
- Include multiple rows per disease.
- Aim for at least 20 rows total and at least 2 disease classes.
- Prefer many more records for real performance.

Train the model with:

```powershell
python artifacts/ai-backend/ml/train_symptom_model.py
```

After training, restart the Flask backend:

```powershell
python artifacts/ai-backend/app.py
```

Important:

- The fallback symptom predictor in this repo is a synthetic demo model.
- It should not be treated as a clinically validated predictor.
