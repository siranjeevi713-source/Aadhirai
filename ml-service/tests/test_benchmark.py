import os
import sys
from pathlib import Path

# Add ml-service root to python path
current_dir = Path(__file__).resolve().parent
ml_root = current_dir.parent
sys.path.insert(0, str(ml_root))

from preprocessing.image_processor import ImagePreprocessor
from inference.classifier import CivicClassifier

DATASET_ROOT = Path(__file__).resolve().parent.parent.parent / "test_dataset"

TEST_SUITE = [
    ("road/pothole_small.jpg", "POTHOLE"),
    ("road/pothole_asphalt.jpg", "POTHOLE"),
    ("road/clean_road.jpg", "OTHER / UNCLEAR"),
    ("sanitation/garbage_pile.jpg", "GARBAGE_ACCUMULATION"),
    ("sanitation/plastic_waste.jpg", "GARBAGE_ACCUMULATION"),
    ("water/water_pipe_leak.jpg", "WATER_LEAKAGE"),
    ("water/flooded_street.jpg", "WATERLOGGING"),
    ("drainage/open_drain.jpg", "DRAINAGE_BLOCKAGE"),
    ("electrical/broken_streetlight.jpg", "BROKEN_STREETLIGHT"),
    ("unrelated/food_dish.jpg", "OTHER / UNCLEAR"),
    ("unrelated/cat_animal.jpg", "OTHER / UNCLEAR"),
    ("unrelated/indoor_room.jpg", "OTHER / UNCLEAR"),
    ("unrelated/person_portrait.jpg", "OTHER / UNCLEAR"),
    ("unrelated/mountain_landscape.jpg", "OTHER / UNCLEAR"),
]

def run_tests():
    passed = 0
    total = len(TEST_SUITE)
    print("=" * 80)
    print("AADHIRAI ML-SERVICE BENCHMARK")
    print("=" * 80)

    for rel_path, expected in TEST_SUITE:
        file_path = DATASET_ROOT / rel_path
        if not file_path.exists():
            print(f"[SKIP] Missing: {rel_path}")
            continue

        with open(file_path, "rb") as f:
            image_bytes = f.read()

        preprocessed = ImagePreprocessor.preprocess_image(image_bytes)
        res = CivicClassifier.classify(preprocessed)
        pred = res["predictedCategory"]
        conf = res["confidence"]

        if pred == expected or (expected == "POTHOLE" and pred in ["POTHOLE", "ROAD_DAMAGE"]):
            passed += 1
            print(f"[PASS] {rel_path:35s} -> {pred:22s} (Conf: {conf})")
        else:
            print(f"[FAIL] {rel_path:35s} -> Expected: {expected}, Got: {pred}")

    print("-" * 80)
    print(f"Passed: {passed}/{total} ({passed/total*100:.1f}%)")
    print("=" * 80)
    assert passed == total, f"Only {passed}/{total} tests passed."

if __name__ == "__main__":
    run_tests()
