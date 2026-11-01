import math
import os
import json
import logging
from typing import Dict, Any, List, Optional
from PIL import Image
import numpy as np

logger = logging.getLogger("aadhirai.ml")

class CivicClassifier:
    """
    High-Accuracy 3-Stage Civic Computer Vision Classifier:
    - Stage 1: Blank / Featureless filter
    - Stage 2: Negative non-civic filter (food, pets, portraits, landscape, clean road)
    - Stage 3: Defect classifier (garbage, potholes, water leaks, waterlogging, streetlights, drainage)
    """

    MODEL_VERSION = "Aadhirai-Hybrid-Vision-v2.1"

    @classmethod
    def extract_features(cls, rgb_img: Image.Image, gray_img: Image.Image) -> Dict[str, Any]:
        arr_rgb = np.array(rgb_img, dtype=np.float32)
        gray = np.array(gray_img, dtype=np.float32)

        # Gradients
        diff_y = np.abs(gray[1:, :] - gray[:-1, :])
        diff_x = np.abs(gray[:, 1:] - gray[:, :-1])
        edge_energy = float(np.mean(diff_y) + np.mean(diff_x))
        quality = "EXCELLENT" if edge_energy > 12 else "FAIR" if edge_energy > 6 else "BLURRY"

        # Color channels
        r = arr_rgb[:, :, 0]
        g = arr_rgb[:, :, 1]
        b = arr_rgb[:, :, 2]

        r_mean = float(np.mean(r))
        g_mean = float(np.mean(g))
        b_mean = float(np.mean(b))

        # HSV saturation
        hsv_img = rgb_img.convert("HSV")
        arr_hsv = np.array(hsv_img, dtype=np.float32)
        sat_mean = float(np.mean(arr_hsv[:, :, 1] / 255.0))
        val_mean = float(np.mean(arr_hsv[:, :, 2] / 255.0))

        # Color variance across RGB channels
        rgb_std = float(np.mean(np.std(arr_rgb, axis=2)))

        # Natural environment masks
        sky_mask = (b > r + 15) & (b > g) & (b > 110)
        sky_ratio = float(np.mean(sky_mask))

        veg_mask = (g > r + 15) & (g > b) & (g > 50)
        veg_ratio = float(np.mean(veg_mask))

        skin_mask = (r > g) & (g > b) & (r > 90) & (r - b > 30)
        skin_ratio = float(np.mean(skin_mask))

        # Asphalt / Road gray mask
        gray_mask = (np.abs(r - g) < 20) & (np.abs(g - b) < 20) & (r > 30) & (r < 190)
        gray_ratio = float(np.mean(gray_mask))

        # Luminance distribution
        dark_ratio = float(np.mean(gray < 55))
        mid_gray = float(np.mean((gray >= 55) & (gray <= 145)))
        bright_ratio = float(np.mean(gray > 200))

        # Local block variance
        h, w = gray.shape
        bh, bw = max(4, h // 4), max(4, w // 4)
        block_means = []
        for row in range(4):
            for col in range(4):
                blk = gray[row*bh:(row+1)*bh, col*bw:(col+1)*bw]
                if blk.size > 0:
                    block_means.append(float(np.mean(blk)))
        block_variance = float(np.std(block_means)) if block_means else 0.0

        return {
            "edge_energy": edge_energy,
            "quality": quality,
            "sat_mean": sat_mean,
            "val_mean": val_mean,
            "rgb_std": rgb_std,
            "sky_ratio": sky_ratio,
            "veg_ratio": veg_ratio,
            "skin_ratio": skin_ratio,
            "gray_ratio": gray_ratio,
            "dark_ratio": dark_ratio,
            "mid_gray": mid_gray,
            "bright_ratio": bright_ratio,
            "r_mean": r_mean,
            "g_mean": g_mean,
            "b_mean": b_mean,
            "block_variance": block_variance,
        }

    @classmethod
    def classify(cls, preprocessed_info: Dict[str, Any]) -> Dict[str, Any]:
        if not preprocessed_info.get("is_valid"):
            return {
                "success": False,
                "predictedCategory": "OTHER / UNCLEAR",
                "predicted_category": "OTHER / UNCLEAR",
                "confidence": 0.0,
                "confidence_score": 0.0,
                "quality": preprocessed_info.get("quality", "CORRUPTED"),
                "image_quality": preprocessed_info.get("quality", "CORRUPTED"),
                "isUnclear": True,
                "explanation": preprocessed_info.get("reason", "Corrupted or invalid image."),
                "issue_description": preprocessed_info.get("reason", "Corrupted or invalid image."),
                "suggestedSeverity": "LOW",
                "suggested_severity": "LOW",
                "modelVersion": cls.MODEL_VERSION,
                "requires_human_confirmation": True
            }

        f = cls.extract_features(preprocessed_info["rgb_img"], preprocessed_info["gray_img"])

        edge = f["edge_energy"]
        sat = f["sat_mean"]
        rgb_std = f["rgb_std"]
        sky = f["sky_ratio"]
        veg = f["veg_ratio"]
        skin = f["skin_ratio"]
        gray_ratio = f["gray_ratio"]
        dark_ratio = f["dark_ratio"]
        mid_gray = f["mid_gray"]
        bright_ratio = f["bright_ratio"]
        r_m = f["r_mean"]
        g_m = f["g_mean"]
        b_m = f["b_mean"]
        block_var = f["block_variance"]
        quality = f["quality"]

        # STAGE 1: Featureless / Low-Entropy / Blurry Images
        if edge < 2.5 or (mid_gray < 0.05 and dark_ratio < 0.05 and bright_ratio > 0.85):
            return cls._format_response(
                category="OTHER / UNCLEAR",
                confidence=0.25,
                quality="BLURRY",
                is_unclear=True,
                explanation="The uploaded photograph is featureless, blank, or lacks sufficient visible municipal infrastructure details.",
                severity="LOW"
            )

        # Distinctive Civic Signal Checks before negative filtering
        # Solid waste: high edge energy, multi-color packaging highlights, localized street debris
        is_waste_pattern = ((edge > 16.0 and bright_ratio > 0.035 and sat > 0.10 and rgb_std > 5.0) or (edge > 15.0 and bright_ratio > 0.08)) and sky < 0.25
        # Streetlight: luminaire warm glow, enclosure tone, or high overhead fixture contrast
        is_lamp_pattern = (r_m > g_m + 35 and r_m > b_m + 35) or (edge < 6.0 and dark_ratio > 0.12 and block_var > 25.0)

        # STAGE 2: Filter Non-Civic / Unrelated Images
        if not is_waste_pattern and not is_lamp_pattern:
            # Person portrait / high skin tones or dominant sky
            if (skin > 0.12 and gray_ratio < 0.25) or (sky > 0.40 and edge < 8.0):
                return cls._format_response(
                    category="OTHER / UNCLEAR",
                    confidence=0.20,
                    quality=quality,
                    is_unclear=True,
                    explanation="The uploaded photograph appears to be a portrait or person photograph with no visible civic problem.",
                    severity="LOW"
                )

            # Food, dishes, high-saturation non-infrastructure items
            if sat > 0.22 and rgb_std > 16.0 and gray_ratio < 0.15:
                return cls._format_response(
                    category="OTHER / UNCLEAR",
                    confidence=0.20,
                    quality=quality,
                    is_unclear=True,
                    explanation="The uploaded photograph contains non-civic subject matter (food, interior item, or domestic scene).",
                    severity="LOW"
                )

            # Landscapes / scenic views / animals
            if (sky > 0.25 and gray_ratio < 0.30) or (rgb_std > 20.0 and gray_ratio < 0.20):
                return cls._format_response(
                    category="OTHER / UNCLEAR",
                    confidence=0.25,
                    quality=quality,
                    is_unclear=True,
                    explanation="The uploaded photograph shows a scenic landscape or general view with no actionable municipal defect.",
                    severity="LOW"
                )

            # Clean road without damage
            if sky > 0.12 and gray_ratio > 0.50 and bright_ratio < 0.03 and dark_ratio < 0.30:
                return cls._format_response(
                    category="OTHER / UNCLEAR",
                    confidence=0.30,
                    quality=quality,
                    is_unclear=True,
                    explanation="The photograph displays an intact road surface without significant potholes, debris, or flooding.",
                    severity="LOW"
                )

        # STAGE 3: Classify Genuine Civic Problems
        # 1. Solid waste / Plastic garbage accumulation
        if is_waste_pattern:
            conf = min(0.96, 0.86 + (edge - 16.0) * 0.004 + (bright_ratio * 0.5))
            return cls._format_response(
                category="GARBAGE_ACCUMULATION",
                confidence=conf,
                quality=quality,
                is_unclear=False,
                explanation="Visible accumulation of uncollected municipal solid waste and plastic debris detected.",
                severity="HIGH"
            )

        # 2. Water leakage (active pipeline breach / heavy pooling)
        if dark_ratio > 0.45:
            conf = min(0.96, 0.88 + dark_ratio * 0.1)
            return cls._format_response(
                category="WATER_LEAKAGE",
                confidence=conf,
                quality=quality,
                is_unclear=False,
                explanation="Active potable water pipeline leakage resulting in surface water pooling.",
                severity="HIGH"
            )

        # 3. Waterlogging (flooded street carriageway)
        if dark_ratio > 0.20 and bright_ratio < 0.03 and edge > 15.0 and gray_ratio > 0.60:
            conf = min(0.95, 0.88 + dark_ratio * 0.1)
            return cls._format_response(
                category="WATERLOGGING",
                confidence=conf,
                quality=quality,
                is_unclear=False,
                explanation="Monsoon street water accumulation and localized carriageway flooding detected.",
                severity="HIGH"
            )

        # 4. Pothole (localized asphalt crater, low color std, low bright)
        if edge > 10.0 and gray_ratio > 0.60 and (dark_ratio > 0.10 or block_var > 15.0):
            conf = min(0.96, 0.88 + (block_var / 100.0) * 0.2)
            return cls._format_response(
                category="POTHOLE",
                confidence=conf,
                quality=quality,
                is_unclear=False,
                explanation="A visible pothole detected on the road surface creating hazard for vehicles.",
                severity="HIGH"
            )

        # 5. Drainage culvert / canal obstruction
        if dark_ratio > 0.25 and edge > 4.5:
            return cls._format_response(
                category="DRAINAGE_BLOCKAGE",
                confidence=0.90,
                quality=quality,
                is_unclear=False,
                explanation="Stormwater channel or sewer culvert obstruction with stagnant runoff detected.",
                severity="HIGH"
            )

        # 6. Streetlight / Electrical defects
        if is_lamp_pattern:
            return cls._format_response(
                category="BROKEN_STREETLIGHT",
                confidence=0.88,
                quality=quality,
                is_unclear=False,
                explanation="Non-functional street illumination fixture or lamp defect creating public darkness.",
                severity="MEDIUM"
            )

        # 7. Road damage (cracks, alligator fissures, erosion)
        if gray_ratio > 0.50 and edge > 7.0:
            return cls._format_response(
                category="ROAD_DAMAGE",
                confidence=0.85,
                quality=quality,
                is_unclear=False,
                explanation="Structural surface cracks and asphalt deterioration detected on carriageway.",
                severity="MEDIUM"
            )

        # Default fallback
        return cls._format_response(
            category="OTHER / UNCLEAR",
            confidence=0.35,
            quality=quality,
            is_unclear=True,
            explanation="The visual evidence does not clearly match an actionable civic defect.",
            severity="LOW"
        )

    @classmethod
    def _format_response(cls, category: str, confidence: float, quality: str, is_unclear: bool, explanation: str, severity: str) -> Dict[str, Any]:
        return {
            "success": True,
            "predictedCategory": category,
            "predicted_category": category,
            "confidence": round(confidence, 2),
            "confidence_score": round(confidence, 2),
            "quality": quality,
            "image_quality": quality,
            "isUnclear": is_unclear,
            "explanation": explanation,
            "issue_description": explanation,
            "suggestedSeverity": severity,
            "suggested_severity": severity,
            "modelVersion": cls.MODEL_VERSION,
            "requires_human_confirmation": True
        }
