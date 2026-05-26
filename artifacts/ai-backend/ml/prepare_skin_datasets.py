import argparse
import shutil
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ml.dataset_metadata import SKIN_DATASET_DIR, ensure_artifact_dirs  # noqa: E402


VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

ISMMAILPROMUS_MAP = {
    "1. Eczema 1677": "eczema",
    "Atopic Dermatitis": "atopic_dermatitis",
    "2. Melanoma 15.75k": "melanoma",
    "3. Atopic Dermatitis - 1.25k": "atopic_dermatitis",
    "Basal Cell Carcinoma": "basal_cell_carcinoma",
    "4. Basal Cell Carcinoma (BCC) 3323": "basal_cell_carcinoma",
    "Benign keratosis-like lesions": "benign_keratosis_like_lesions",
    "Benign Keratosis-like Lesions": "benign_keratosis_like_lesions",
    "5. Melanocytic Nevi (NV) - 7970": "melanocytic_nevi",
    "6. Benign Keratosis-like Lesions (BKL) 2624": "benign_keratosis_like_lesions",
    "Eczema": "eczema",
    "Melanocytic Nevi": "melanocytic_nevi",
    "Melanoma": "melanoma",
    "Psoriasis pictures Lichen Planus and related diseases": "psoriasis_lichen_planus",
    "7. Psoriasis pictures Lichen Planus and related diseases - 2k": "psoriasis_lichen_planus",
    "Seborrheic Keratoses and other Benign Tumors": "seborrheic_keratoses",
    "8. Seborrheic Keratoses and other Benign Tumors - 1.8k": "seborrheic_keratoses",
    "Tinea Ringworm Candidiasis and other Fungal Infections": "fungal_infection",
    "9. Tinea Ringworm Candidiasis and other Fungal Infections - 1.7k": "fungal_infection",
    "Warts Molluscum and other Viral Infections": "viral_warts_molluscum",
    "10. Warts Molluscum and other Viral Infections - 2103": "viral_warts_molluscum",
}

AMELLIA_MAP = {
    "Acne": "acne",
    "Acnitic Keratosis": "actinic_keratosis",
    "Actinic Keratosis": "actinic_keratosis",
    "Basal Cell Carcinoma": "basal_cell_carcinoma",
    "Eczema": "eczema",
    "Eczemaa": "eczema",
    "Rosacea": "rosacea",
}


def discover_class_dirs(root: Path):
    split_dirs = [root / "train", root / "test", root / "testing", root / "val", root / "valid"]
    existing_splits = [path for path in split_dirs if path.exists()]
    if existing_splits:
        for split_dir in existing_splits:
            split_name = split_dir.name
            if split_name == "valid":
                split_name = "val"
            elif split_name == "testing":
                split_name = "test"
            for class_dir in sorted(path for path in split_dir.iterdir() if path.is_dir()):
                yield split_name, class_dir
        return

    for class_dir in sorted(path for path in root.iterdir() if path.is_dir()):
        yield "all", class_dir


def copy_images(source_dir: Path, target_dir: Path):
    target_dir.mkdir(parents=True, exist_ok=True)
    copied = 0
    for image_path in sorted(source_dir.rglob("*")):
        if image_path.is_file() and image_path.suffix.lower() in VALID_EXTENSIONS:
            destination = target_dir / image_path.name
            stem = destination.stem
            suffix = destination.suffix
            counter = 1
            while destination.exists():
                destination = target_dir / f"{stem}_{counter}{suffix}"
                counter += 1
            shutil.copy2(image_path, destination)
            copied += 1
    return copied


def ingest_dataset(source_root: Path, label_map: dict, output_root: Path):
    copied_total = 0
    for split_name, class_dir in discover_class_dirs(source_root):
        canonical = label_map.get(class_dir.name)
        if not canonical:
            print(f"Skipping unmapped class: {class_dir.name}")
            continue

        if split_name == "all":
            target_dir = output_root / canonical
        else:
            target_dir = output_root / split_name / canonical
        copied = copy_images(class_dir, target_dir)
        copied_total += copied
        print(f"Copied {copied} images from {class_dir.name} -> {target_dir}")
    return copied_total


def main():
    parser = argparse.ArgumentParser(description="Normalize raw Kaggle skin datasets into canonical class folders.")
    parser.add_argument(
        "--ismailpromus-root",
        help="Path to the extracted Kaggle dataset root for ismailpromus/skin-diseases-image-dataset.",
    )
    parser.add_argument(
        "--amellia-root",
        help="Path to the extracted Kaggle dataset root for amellia/face-skin-disease.",
    )
    parser.add_argument(
        "--output-dir",
        default=str(SKIN_DATASET_DIR),
        help="Output directory for the normalized dataset.",
    )
    args = parser.parse_args()

    ensure_artifact_dirs()
    output_root = Path(args.output_dir).resolve()
    output_root.mkdir(parents=True, exist_ok=True)

    copied_total = 0

    if args.ismailpromus_root:
        copied_total += ingest_dataset(Path(args.ismailpromus_root).resolve(), ISMMAILPROMUS_MAP, output_root)
    if args.amellia_root:
        copied_total += ingest_dataset(Path(args.amellia_root).resolve(), AMELLIA_MAP, output_root)

    if copied_total == 0:
        raise SystemExit("No images were copied. Check the dataset root paths and folder names.")

    print(f"Dataset preparation complete. Total copied images: {copied_total}")


if __name__ == "__main__":
    main()
