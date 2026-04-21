SYMPTOMS = [
    "fever", "cough", "headache", "fatigue", "nausea", "vomiting",
    "diarrhea", "chest_pain", "shortness_of_breath", "skin_rash",
    "joint_pain", "muscle_pain", "sore_throat", "runny_nose",
    "loss_of_appetite", "weight_loss", "excessive_thirst", "frequent_urination",
    "eye_redness", "stomach_pain", "back_pain", "dizziness", "sweating",
    "chills", "body_ache", "swollen_lymph_nodes"
]

DISEASES = [
    "Influenza",
    "Common Cold",
    "Dengue Fever",
    "Malaria",
    "Typhoid",
    "Type 2 Diabetes",
    "Hypertension",
    "Asthma",
    "Pneumonia",
    "Tuberculosis",
    "Food Poisoning",
    "Urinary Tract Infection",
    "Migraine",
    "Anemia",
    "Skin Allergy",
    "Conjunctivitis",
    "Arthritis",
    "Appendicitis",
    "Gastritis",
    "Anxiety Disorder",
]

DISEASE_SYMPTOM_MAP = {
    "Influenza":              [1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1,0],
    "Common Cold":            [0,1,0,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    "Dengue Fever":           [1,0,1,1,1,1,0,0,0,1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,1,0],
    "Malaria":                [1,0,1,1,1,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,1,1,0],
    "Typhoid":                [1,0,1,1,1,1,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1],
    "Type 2 Diabetes":        [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,0,0,0,0],
    "Hypertension":           [0,0,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
    "Asthma":                 [0,1,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
    "Pneumonia":              [1,1,0,1,0,0,0,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
    "Tuberculosis":           [1,1,0,1,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,1,0,0,1],
    "Food Poisoning":         [1,0,1,1,1,1,1,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0],
    "Urinary Tract Infection":[1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0],
    "Migraine":               [0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0],
    "Anemia":                 [0,0,1,1,0,0,0,0,1,0,1,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0],
    "Skin Allergy":           [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "Conjunctivitis":         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    "Arthritis":              [0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
    "Appendicitis":           [1,0,0,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0],
    "Gastritis":              [0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0],
    "Anxiety Disorder":       [0,0,1,1,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,1,0,1,1,0,0,0],
}


def generate_training_data(samples_per_disease=40):
    import numpy as np
    X, y = [], []
    rng = np.random.default_rng(42)
    for disease, symptom_vec in DISEASE_SYMPTOM_MAP.items():
        for _ in range(samples_per_disease):
            noise = rng.integers(0, 2, size=len(SYMPTOMS))
            noisy = [1 if (symptom_vec[i] == 1 and rng.random() > 0.1) or (symptom_vec[i] == 0 and rng.random() < 0.08) else 0 for i in range(len(SYMPTOMS))]
            X.append(noisy)
            y.append(disease)
    return X, y
