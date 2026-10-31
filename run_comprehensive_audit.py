import os, sys
from PIL import Image
sys.path.insert(0, r"d:\aadhrai\backend")
from app.services.ai_service import AIService

test_suite = [
    # (Label, Expected Category, Path)
    ("Small Pothole", "POTHOLE", r"d:\aadhrai\test_dataset\road\pothole_small.jpg"),
    ("Asphalt Pothole", "POTHOLE", r"d:\aadhrai\test_dataset\road\pothole_asphalt.jpg"),
    ("Clean Normal Road", "UNCLEAR_OR_UNDETECTABLE", r"d:\aadhrai\test_dataset\road\clean_road.jpg"),
    ("Garbage Pile", "GARBAGE_ACCUMULATION", r"d:\aadhrai\test_dataset\sanitation\garbage_pile.jpg"),
    ("Plastic Waste", "GARBAGE_ACCUMULATION", r"d:\aadhrai\test_dataset\sanitation\plastic_waste.jpg"),
    ("Water Pipe Leak", "WATER_LEAKAGE", r"d:\aadhrai\test_dataset\water\water_pipe_leak.jpg"),
    ("Flooded Street", "WATERLOGGING", r"d:\aadhrai\test_dataset\water\flooded_street.jpg"),
    ("Open Drainage", "DRAINAGE_BLOCKAGE", r"d:\aadhrai\test_dataset\drainage\open_drain.jpg"),
    ("Streetlight", "BROKEN_STREETLIGHT", r"d:\aadhrai\test_dataset\electrical\broken_streetlight.jpg"),
    ("Food Dish (Unrelated)", "UNCLEAR_OR_UNDETECTABLE", r"d:\aadhrai\test_dataset\unrelated\food_dish.jpg"),
    ("Cat Animal (Unrelated)", "UNCLEAR_OR_UNDETECTABLE", r"d:\aadhrai\test_dataset\unrelated\cat_animal.jpg"),
    ("Indoor Room (Unrelated)", "UNCLEAR_OR_UNDETECTABLE", r"d:\aadhrai\test_dataset\unrelated\indoor_room.jpg"),
    ("Person Portrait (Unrelated)", "UNCLEAR_OR_UNDETECTABLE", r"d:\aadhrai\test_dataset\unrelated\person_portrait.jpg"),
    ("Mountain Landscape (Unrelated)", "UNCLEAR_OR_UNDETECTABLE", r"d:\aadhrai\test_dataset\unrelated\mountain_landscape.jpg"),
]

correct = 0
total = len(test_suite)

print(f"{'Test Image':28s} | {'Expected':23s} | {'Predicted':23s} | {'Match':6s} | Conf | Status")
print("-" * 105)

for label, expected, p in test_suite:
    with open(p, "rb") as f:
        b = f.read()
    res = AIService.analyze_civic_image(b)
    pred = res.get("predicted_category")
    conf = res.get("confidence_score")
    match = (pred == expected) or (expected == "POTHOLE" and pred in ["POTHOLE", "ROAD_DAMAGE"])
    if match:
        correct += 1
    match_str = "PASS" if match else "FAIL"
    print(f"{label:28s} | {expected:23s} | {pred:23s} | {match_str:6s} | {conf:.2f} | {res.get('image_quality')}")

print("-" * 105)
print(f"Accuracy: {correct}/{total} ({correct/total*100:.1f}%)")
