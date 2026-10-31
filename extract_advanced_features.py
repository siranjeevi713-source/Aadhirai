import os, sys
from PIL import Image
import numpy as np
sys.path.insert(0, r"d:\aadhrai\backend")
from app.services.ai_service import AIService

for f in os.listdir(r"d:\aadhrai\test_dataset\unrelated"):
    p = os.path.join(r"d:\aadhrai\test_dataset\unrelated", f)
    img = Image.open(p).convert("RGB")
    hsv = img.convert("HSV")
    arr_rgb = np.array(img, dtype=np.float32)
    arr_hsv = np.array(hsv, dtype=np.float32)
    
    # Saturation
    sat_mean = np.mean(arr_hsv[:, :, 1] / 255.0)
    val_mean = np.mean(arr_hsv[:, :, 2] / 255.0)
    
    # Color variance across RGB
    rgb_std = np.mean(np.std(arr_rgb, axis=2))
    
    # Sky / vegetation ratio
    r, g, b = arr_rgb[:, :, 0], arr_rgb[:, :, 1], arr_rgb[:, :, 2]
    sky_mask = (b > r + 20) & (b > g) & (b > 120)
    sky_ratio = np.mean(sky_mask)
    
    # Warm / skin tone ratio
    skin_mask = (r > g) & (g > b) & (r > 90) & (r - b > 30)
    skin_ratio = np.mean(skin_mask)
    
    # Asphalt / Gray road ratio
    gray_mask = (np.abs(r - g) < 18) & (np.abs(g - b) < 18) & (r > 35) & (r < 180)
    gray_ratio = np.mean(gray_mask)
    
    print(f"Unrelated: {f:25s} | Sat: {sat_mean:.2f} | RGB_std: {rgb_std:4.1f} | Sky: {sky_ratio:.2f} | Skin: {skin_ratio:.2f} | Gray: {gray_ratio:.2f}")

for f in ["pothole_small.jpg", "pothole_asphalt.jpg", "clean_road.jpg"]:
    p = os.path.join(r"d:\aadhrai\test_dataset\road", f)
    img = Image.open(p).convert("RGB")
    hsv = img.convert("HSV")
    arr_rgb = np.array(img, dtype=np.float32)
    arr_hsv = np.array(hsv, dtype=np.float32)
    sat_mean = np.mean(arr_hsv[:, :, 1] / 255.0)
    rgb_std = np.mean(np.std(arr_rgb, axis=2))
    r, g, b = arr_rgb[:, :, 0], arr_rgb[:, :, 1], arr_rgb[:, :, 2]
    gray_mask = (np.abs(r - g) < 18) & (np.abs(g - b) < 18) & (r > 35) & (r < 180)
    gray_ratio = np.mean(gray_mask)
    print(f"Road:      {f:25s} | Sat: {sat_mean:.2f} | RGB_std: {rgb_std:4.1f} | Gray: {gray_ratio:.2f}")
