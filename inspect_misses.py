import sys
sys.path.insert(0, r"d:\aadhrai\backend")
from PIL import Image
from app.services.ai_service import AIService

for f, name in [(r"d:\aadhrai\test_dataset\sanitation\plastic_waste.jpg", "Plastic"), (r"d:\aadhrai\test_dataset\electrical\broken_streetlight.jpg", "Light")]:
    prep = AIService._preprocess_and_validate(open(f, 'rb').read())
    feats = AIService._extract_civic_features(prep['img'], prep['gray_img'])
    print(name, "->")
    for k, v in feats.items():
        if isinstance(v, float):
            print(f"  {k:15s}: {v:.3f}")
        else:
            print(f"  {k:15s}: {v}")
