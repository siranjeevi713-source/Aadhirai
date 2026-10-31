import glob, os, sys
from PIL import Image
sys.path.insert(0, r"d:\aadhrai\backend")
from app.services.ai_service import AIService

samples = [
    ('Pothole', r'd:\aadhrai\frontend\public\images\pothole-hd.jpg'),
    ('Pothole2', r'd:\aadhrai\frontend\public\images\pothole-before.jpg'),
    ('Garbage', r'd:\aadhrai\frontend\public\images\sample-garbage.jpg'),
    ('Water', r'd:\aadhrai\frontend\public\images\sample-water.jpg'),
    ('Streetlight', r'd:\aadhrai\frontend\public\images\sample-light.jpg'),
    ('Drainage', r'd:\aadhrai\frontend\public\images\sample-drainage.jpg'),
    ('Sketch', r'd:\aadhrai\frontend\public\images\musiri-sketch.jpg'),
    ('Hero', r'd:\aadhrai\frontend\public\images\landing-hero.jpg'),
]

for label, p in samples:
    if os.path.exists(p):
        with open(p, 'rb') as f:
            b = f.read()
            res = AIService.analyze_civic_image(b)
            h = AIService._analyze_image_heuristics(b)
            pred = res.get('predicted_category')
            conf = res.get('confidence_score')
            edge = h.get('edge_energy', 0)
            dark = h.get('dark_ratio', 0)
            bright = h.get('bright_ratio', 0)
            r = h.get('r_mean', 0)
            g = h.get('g_mean', 0)
            bl = h.get('b_mean', 0)
            print(f"{label:12s} | Pred: {pred:20s} | Conf: {conf:.2f} | Edge: {edge:5.1f} | Dark: {dark:4.2f} | Bright: {bright:4.2f} | R: {r:3.0f} G: {g:3.0f} B: {bl:3.0f}")
