import argparse
import csv
import json
import random
import sys
from collections import Counter, defaultdict
from pathlib import Path

import torch
from PIL import Image
from sklearn.metrics import classification_report, confusion_matrix
from torch import nn
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from torchvision import models, transforms

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ml.dataset_metadata import (  # noqa: E402
    SKIN_CNN_MODEL_PATH,
    SKIN_DATASET_DIR,
    ensure_artifact_dirs,
    save_model_metadata,
)


VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
RESERVED_SPLITS = {"train", "test", "testing", "val", "valid"}
REPORT_PATH = SKIN_CNN_MODEL_PATH.with_name("skin_condition_cnn_report.json")
CONFUSION_MATRIX_PATH = SKIN_CNN_MODEL_PATH.with_name("skin_condition_cnn_confusion_matrix.csv")


def normalize_split_name(name: str) -> str:
    if name == "testing":
        return "test"
    if name == "valid":
        return "val"
    return name


def discover_items(dataset_dir: Path):
    grouped = {"train": [], "test": [], "val": []}

    for split_name in ("train", "test", "testing", "val", "valid"):
        split_dir = dataset_dir / split_name
        if not split_dir.exists():
            continue
        normalized = normalize_split_name(split_name)
        for class_dir in sorted(path for path in split_dir.iterdir() if path.is_dir()):
            for image_path in sorted(class_dir.rglob("*")):
                if image_path.is_file() and image_path.suffix.lower() in VALID_EXTENSIONS:
                    grouped[normalized].append((image_path, class_dir.name))

    flat_by_class = defaultdict(list)
    for class_dir in sorted(
        path for path in dataset_dir.iterdir() if path.is_dir() and path.name not in RESERVED_SPLITS
    ):
        for image_path in sorted(class_dir.rglob("*")):
            if image_path.is_file() and image_path.suffix.lower() in VALID_EXTENSIONS:
                flat_by_class[class_dir.name].append(image_path)

    rng = random.Random(42)
    for label, paths in flat_by_class.items():
        rng.shuffle(paths)
        if len(paths) >= 10:
            val_count = max(1, int(len(paths) * 0.15))
            grouped["test"].extend((path, label) for path in paths[:val_count])
            grouped["train"].extend((path, label) for path in paths[val_count:])
        else:
            grouped["train"].extend((path, label) for path in paths)

    return grouped


class SkinImageDataset(Dataset):
    def __init__(self, items, class_to_idx, transform):
        self.items = items
        self.class_to_idx = class_to_idx
        self.transform = transform

    def __len__(self):
        return len(self.items)

    def __getitem__(self, index):
        path, label = self.items[index]
        image = Image.open(path).convert("RGB")
        return self.transform(image), self.class_to_idx[label]


def build_transforms():
    mean = [0.485, 0.456, 0.406]
    std = [0.229, 0.224, 0.225]

    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomResizedCrop(224, scale=(0.75, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(12),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15, hue=0.03),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std),
    ])
    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std),
    ])
    return train_transform, eval_transform


def build_model(num_classes: int):
    weights = models.ResNet18_Weights.IMAGENET1K_V1
    model = models.resnet18(weights=weights)
    for param in model.parameters():
        param.requires_grad = False
    for param in model.layer4.parameters():
        param.requires_grad = True
    model.fc = nn.Sequential(
        nn.Dropout(p=0.35),
        nn.Linear(model.fc.in_features, num_classes),
    )
    return model


def make_weighted_sampler(train_items, class_to_idx):
    counts = Counter(label for _, label in train_items)
    sample_weights = [1.0 / counts[label] for _, label in train_items]
    return WeightedRandomSampler(sample_weights, num_samples=len(sample_weights), replacement=True)


def evaluate(model, loader, device, class_names):
    model.eval()
    losses = []
    all_preds = []
    all_targets = []
    criterion = nn.CrossEntropyLoss()

    with torch.no_grad():
        for images, targets in loader:
            images = images.to(device)
            targets = targets.to(device)
            logits = model(images)
            loss = criterion(logits, targets)
            losses.append(loss.item())
            preds = logits.argmax(dim=1)
            all_preds.extend(preds.cpu().tolist())
            all_targets.extend(targets.cpu().tolist())

    target_names = class_names
    report = classification_report(
        all_targets,
        all_preds,
        labels=list(range(len(class_names))),
        target_names=target_names,
        output_dict=True,
        zero_division=0,
    )
    accuracy = report.get("accuracy", 0.0)
    macro_f1 = report.get("macro avg", {}).get("f1-score", 0.0)
    return {
        "loss": sum(losses) / max(1, len(losses)),
        "accuracy": accuracy,
        "macro_f1": macro_f1,
        "report": report,
        "predictions": all_preds,
        "targets": all_targets,
    }


def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    running_loss = 0.0
    total = 0
    correct = 0

    for batch_idx, (images, targets) in enumerate(loader, start=1):
        images = images.to(device)
        targets = targets.to(device)

        optimizer.zero_grad()
        logits = model(images)
        loss = criterion(logits, targets)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        preds = logits.argmax(dim=1)
        total += targets.size(0)
        correct += (preds == targets).sum().item()

        if batch_idx % 50 == 0:
            print(
                f"  batch {batch_idx}/{len(loader)} "
                f"loss={running_loss / batch_idx:.4f} "
                f"acc={(correct / max(1, total)):.4f}"
            )

    return running_loss / max(1, len(loader)), correct / max(1, total)


def save_artifacts(class_names, eval_result):
    matrix = confusion_matrix(
        eval_result["targets"],
        eval_result["predictions"],
        labels=list(range(len(class_names))),
    )
    with open(CONFUSION_MATRIX_PATH, "w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["actual/predicted", *class_names])
        for label, row in zip(class_names, matrix.tolist()):
            writer.writerow([label, *row])

    payload = {
        "classes": class_names,
        "report": eval_result["report"],
    }
    with open(REPORT_PATH, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Train a transfer-learning CNN for skin condition classification.")
    parser.add_argument("--dataset-dir", default=str(SKIN_DATASET_DIR))
    parser.add_argument("--epochs", type=int, default=6)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir).resolve()
    ensure_artifact_dirs()

    grouped = discover_items(dataset_dir)
    train_items = grouped["train"]
    test_items = grouped["test"] or grouped["val"]

    if len(train_items) < 100 or len(test_items) < 20:
        raise SystemExit("Need enough train and test images before training the CNN.")

    class_names = sorted({label for _, label in train_items + test_items})
    class_to_idx = {label: idx for idx, label in enumerate(class_names)}
    train_counts = Counter(label for _, label in train_items)
    total_counts = Counter(label for _, label in train_items + test_items)

    train_tf, eval_tf = build_transforms()
    train_ds = SkinImageDataset(train_items, class_to_idx, train_tf)
    test_ds = SkinImageDataset(test_items, class_to_idx, eval_tf)

    sampler = make_weighted_sampler(train_items, class_to_idx)
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, sampler=sampler, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    device = torch.device("cpu")
    model = build_model(len(class_names)).to(device)

    class_weights = torch.tensor(
        [1.0 / train_counts.get(label, 1) for label in class_names],
        dtype=torch.float32,
        device=device,
    )
    class_weights = class_weights / class_weights.sum() * len(class_names)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = torch.optim.AdamW(
        [param for param in model.parameters() if param.requires_grad],
        lr=args.lr,
        weight_decay=1e-4,
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_state = None
    best_eval = None

    print(f"Training CNN on {len(train_items)} train images and {len(test_items)} eval images")
    for epoch in range(1, args.epochs + 1):
        print(f"Epoch {epoch}/{args.epochs}")
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, device)
        eval_result = evaluate(model, test_loader, device, class_names)
        scheduler.step()
        print(
            f"  train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
            f"val_loss={eval_result['loss']:.4f} val_acc={eval_result['accuracy']:.4f} "
            f"val_macro_f1={eval_result['macro_f1']:.4f}"
        )

        if best_eval is None or (
            eval_result["macro_f1"],
            eval_result["accuracy"],
        ) > (
            best_eval["macro_f1"],
            best_eval["accuracy"],
        ):
            best_eval = eval_result
            best_state = {key: value.cpu() for key, value in model.state_dict().items()}

    if best_state is None:
        raise SystemExit("Training failed to produce a model.")

    checkpoint = {
        "architecture": "resnet18",
        "classes": class_names,
        "state_dict": best_state,
    }
    torch.save(checkpoint, SKIN_CNN_MODEL_PATH)
    save_artifacts(class_names, best_eval)

    metadata = {
        "model_name": "resnet18 transfer-learning skin condition classifier",
        "feature_version": "cnn_resnet18_imagenet_transfer",
        "dataset": {
            "name": "Local labeled skin-condition dataset",
            "source": "User-provided local dataset",
            "path": str(dataset_dir),
            "classes": class_names,
            "image_count": sum(total_counts.values()),
            "class_counts": dict(total_counts),
            "split_strategy": "hybrid_image_transfer_learning",
        },
        "metrics": {
            "accuracy": round(best_eval["accuracy"], 4),
            "macro_avg_f1": round(best_eval["macro_f1"], 4),
        },
        "artifacts": {
            "report_json": str(REPORT_PATH),
            "confusion_matrix_csv": str(CONFUSION_MATRIX_PATH),
            "cnn_checkpoint": str(SKIN_CNN_MODEL_PATH),
        },
        "notes": [
            "This model uses transfer learning from ImageNet-pretrained ResNet18.",
            "The Flask app will prefer this CNN checkpoint over the sklearn baseline when present.",
        ],
    }
    save_model_metadata(metadata)

    print("CNN training complete.")
    print(f"Saved CNN checkpoint: {SKIN_CNN_MODEL_PATH}")
    print(f"Saved report: {REPORT_PATH}")
    print(f"Saved confusion matrix: {CONFUSION_MATRIX_PATH}")
    print(f"Best Accuracy: {metadata['metrics']['accuracy']}")
    print(f"Best Macro F1: {metadata['metrics']['macro_avg_f1']}")


if __name__ == "__main__":
    main()
