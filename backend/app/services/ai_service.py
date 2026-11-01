import io
import math
import os
import json
import logging
from typing import Dict, Any, List, Optional
from PIL import Image, ImageOps
import numpy as np
import imagehash
from app.core.config import settings

logger = logging.getLogger("aadhirai.ai")

class AIService:
    @staticmethod
    def compute_phash(image_bytes: bytes) -> str:
        """Compute 64-bit perceptual hash (pHash) from image bytes."""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            phash = imagehash.phash(img)
            return str(phash)
        except Exception:
            return "0000000000000000"

    @staticmethod
    def calculate_phash_hamming_distance(hash1: str, hash2: str) -> int:
        """Calculate Hamming distance between two hex hashes."""
        try:
            h1 = imagehash.hex_to_hash(hash1)
            h2 = imagehash.hex_to_hash(hash2)
            return h1 - h2
        except Exception:
            return 64

    @staticmethod
    def calculate_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Haversine formula to calculate distance between two coordinates in meters."""
        R = 6371000.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    @staticmethod
    def _preprocess_and_validate(image_bytes: bytes) -> Dict[str, Any]:
        """
        Safely validate image format, dimensions, apply EXIF orientation correction.
        """
        try:
            raw_img = Image.open(io.BytesIO(image_bytes))
            format_name = raw_img.format or "JPEG"
            
            # Apply EXIF transpose if rotated by camera
            try:
                img = ImageOps.exif_transpose(raw_img)
            except Exception:
                img = raw_img

            width, height = img.size
            if width < 30 or height < 30:
                return {
                    "is_valid": False,
                    "quality": "POOR",
                    "reason": f"Image dimensions ({width}x{height}) are too small for inspection."
                }

            # Convert to standard RGB
            rgb_img = img.convert("RGB")
            gray_img = img.convert("L")

            return {
                "is_valid": True,
                "img": rgb_img,
                "gray_img": gray_img,
                "width": width,
                "height": height,
                "format": format_name,
            }
        except Exception as e:
            return {
                "is_valid": False,
                "quality": "CORRUPTED",
                "reason": f"Image file corrupted or invalid image format: {str(e)}"
            }

    @staticmethod
    def _extract_civic_features(rgb_img: Image.Image, gray_img: Image.Image) -> Dict[str, Any]:
        """
        Extract computer vision metrics:
        - Grayscale gradient & edge energy (Sobel-like difference)
        - Gray/Asphalt dominance
        - Color saturation (HSV)
        - Color divergence (RGB std)
        - Sky, vegetation, skin-tone ratios
        - Dark ratio, high contrast & localized depression variance
        """
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

        # Color variance across RGB channels (high on colorful scenes/food/clothing/nature)
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

        # Local block variance (detects craters/depression in road surface)
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
    def analyze_civic_image(
        cls,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        user_hint: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze civic evidence photograph.
        1. Validates and preprocesses image bytes with EXIF correction.
        2. Queries Gemini Multimodal API if GEMINI_API_KEY is configured.
        3. Falls back to deterministic Computer Vision heuristics with non-civic / unrelated filtering.
        """
        if len(image_bytes) < 100:
            return {
                "predicted_category": "UNCLEAR_OR_UNDETECTABLE",
                "confidence_score": 0.0,
                "issue_description": "Uploaded image file is empty or corrupted.",
                "visual_indicators": ["Corrupted file format"],
                "suggested_severity": "LOW",
                "image_quality": "CORRUPTED",
                "uncertainty_reason": "No valid pixel payload found",
                "requires_human_confirmation": True,
                "provider_used": "validation",
            }

        prep = cls._preprocess_and_validate(image_bytes)
        if not prep["is_valid"]:
            return {
                "predicted_category": "UNCLEAR_OR_UNDETECTABLE",
                "confidence_score": 0.20,
                "issue_description": prep.get("reason", "Unable to decode image."),
                "visual_indicators": ["Decoding failure"],
                "suggested_severity": "LOW",
                "image_quality": prep.get("quality", "POOR"),
                "uncertainty_reason": prep.get("reason"),
                "requires_human_confirmation": True,
                "provider_used": "validation",
            }

        # 1. Attempt Gemini 2.5 Flash if API key is present
        gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        if gemini_key:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=gemini_key)
                prompt = """You are an automated civic infrastructure inspection engine for municipal corporations in Tamil Nadu, India.
Analyze the provided photograph of a municipal defect.
Classify it strictly into ONE of the following canonical categories:
- POTHOLE (road depression, asphalt hole, crater)
- ROAD_DAMAGE (cracks, uneven surface, damaged tar)
- GARBAGE_ACCUMULATION (uncollected waste, trash heap, plastic accumulation)
- DRAINAGE_BLOCKAGE (choked canal, blocked drain culvert, sewer stagnation)
- WATER_LEAKAGE (burst drinking water pipe, municipal pipeline leak)
- WATERLOGGING (flooded road, monsoon street water accumulation)
- BROKEN_STREETLIGHT (non-functional lamp, broken luminaire, dark post)
- DAMAGED_ELECTRIC_POLE (tilted post, exposed overhead wires)
- DAMAGED_PUBLIC_INFRASTRUCTURE (broken railing, bus shelter, divider defect)
- DAMAGED_FOOTPATH (broken pedestrian pavement)
- OTHER_CIVIC_ISSUE (other civic issue)
- UNCLEAR_OR_UNDETECTABLE (no visible civic issue, selfie, animal, food, indoor room, landscape, normal clean street, blurry)

Return strictly valid JSON matching this schema:
{
  "predicted_category": "POTHOLE",
  "confidence_score": 0.94,
  "issue_description": "Detailed explanation of defect observed",
  "visual_indicators": ["Indicator 1", "Indicator 2"],
  "suggested_severity": "HIGH",
  "image_quality": "EXCELLENT",
  "uncertainty_reason": null,
  "requires_human_confirmation": true
}
Do not include markdown fences, return pure JSON."""

                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        prompt,
                    ],
                )
                if response.text:
                    cleaned_text = response.text.strip()
                    if cleaned_text.startswith("```json"):
                        cleaned_text = cleaned_text[7:]
                    if cleaned_text.startswith("```"):
                        cleaned_text = cleaned_text[3:]
                    if cleaned_text.endswith("```"):
                        cleaned_text = cleaned_text[:-3]
                    parsed = json.loads(cleaned_text.strip())
                    parsed["provider_used"] = "gemini-multimodal"
                    return parsed
            except Exception as e:
                logger.warning(f"Gemini API inference error: {e}. Falling back to Computer Vision engine.")

        # 2. Local Computer Vision Decision Engine
        f = cls._extract_civic_features(prep["img"], prep["gray_img"])

        edge = f["edge_energy"]
        sat = f["sat_mean"]
        rgb_std = f["rgb_std"]
        sky = f["sky_ratio"]
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

        # -------------------------------------------------------------
        # STAGE 1: Check for Featureless / Low-Entropy / Blurry Images
        # -------------------------------------------------------------
        if edge < 2.5 or (mid_gray < 0.05 and dark_ratio < 0.05 and bright_ratio > 0.85):
            return {
                "predicted_category": "UNCLEAR_OR_UNDETECTABLE",
                "confidence_score": 0.25,
                "issue_description": "The uploaded photograph is featureless, blank, or lacks sufficient visible municipal infrastructure details.",
                "visual_indicators": ["Featureless / low entropy image", "Insufficient visual detail"],
                "suggested_severity": "LOW",
                "image_quality": "BLURRY",
                "uncertainty_reason": "No visible civic infrastructure detected",
                "requires_human_confirmation": True,
                "provider_used": "computer_vision_cv_engine",
            }

        # -------------------------------------------------------------
        # STAGE 2: Filter Non-Civic / Unrelated Images (Food, People, Animals, Nature)
        # -------------------------------------------------------------
        # Natural scenes / landscapes with high open sky or mountains
        if sky > 0.25 and (gray_ratio < 0.45 or veg_ratio > 0.10):
            return {
                "predicted_category": "UNCLEAR_OR_UNDETECTABLE",
                "confidence_score": 0.20,
                "issue_description": "The uploaded photograph shows a scenic landscape or horizon with no actionable municipal defect.",
                "visual_indicators": ["Open sky / landscape horizon detected", "No localized municipal defect"],
                "suggested_severity": "LOW",
                "image_quality": quality,
                "uncertainty_reason": "No municipal defect identified in image",
                "requires_human_confirmation": True,
                "provider_used": "computer_vision_cv_engine",
            }

        # Clean normal road with prominent sky and no severe localized pothole crater
        if sky > 0.15 and gray_ratio > 0.50 and bright_ratio < 0.03:
            return {
                "predicted_category": "UNCLEAR_OR_UNDETECTABLE",
                "confidence_score": 0.25,
                "issue_description": "The photograph displays an intact road surface without significant potholes, debris, or flooding.",
                "visual_indicators": ["Normal asphalt carriageway", "No visible structural pothole crater"],
                "suggested_severity": "LOW",
                "image_quality": quality,
                "uncertainty_reason": "Road surface appears clean and undamaged",
                "requires_human_confirmation": True,
                "provider_used": "computer_vision_cv_engine",
            }

        # Exemption: High edge energy with diverse colored debris indicates municipal solid waste / plastic litter!
        is_waste_pattern = ((edge > 16.0 and bright_ratio > 0.035 and sat > 0.10 and rgb_std > 5.0) or (edge > 15.0 and bright_ratio > 0.08)) and sky < 0.25

        # Exemption: Warm lamp enclosure / luminaire glow with high red dominance
        is_lamp_pattern = (r_m > g_m + 35 and r_m > b_m + 35) or (edge < 6.0 and dark_ratio > 0.12 and block_var > 25.0)

        if not is_waste_pattern and not is_lamp_pattern:
            # A. Person portrait / high skin tones or dominant sky
            if (skin > 0.12 and gray_ratio < 0.25) or (sky > 0.40 and edge < 8.0):
                return {
                    "predicted_category": "UNCLEAR_OR_UNDETECTABLE",
                    "confidence_score": 0.20,
                    "issue_description": "The uploaded photograph appears to be a portrait or person photograph with no visible civic problem.",
                    "visual_indicators": ["Non-civic subject (person / portrait detected)", "Low asphalt / infrastructure content"],
                    "suggested_severity": "LOW",
                    "image_quality": quality,
                    "uncertainty_reason": "No municipal defect identified in image",
                    "requires_human_confirmation": True,
                    "provider_used": "computer_vision_cv_engine",
                }

            # B. Food, dishes, high-saturation non-infrastructure items
            if sat > 0.22 and rgb_std > 16.0 and gray_ratio < 0.15:
                return {
                    "predicted_category": "UNCLEAR_OR_UNDETECTABLE",
                    "confidence_score": 0.20,
                    "issue_description": "The uploaded photograph contains non-civic subject matter (food, interior item, or domestic scene).",
                    "visual_indicators": ["High color saturation inconsistent with public infrastructure", "Absence of road or street elements"],
                    "suggested_severity": "LOW",
                    "image_quality": quality,
                    "uncertainty_reason": "No municipal defect identified in image",
                    "requires_human_confirmation": True,
                    "provider_used": "computer_vision_cv_engine",
                }

            # C. Landscapes / scenic views / animals with high sky or low infrastructure
            if (sky > 0.25 and gray_ratio < 0.30) or (rgb_std > 20.0 and gray_ratio < 0.20):
                return {
                    "predicted_category": "UNCLEAR_OR_UNDETECTABLE",
                    "confidence_score": 0.25,
                    "issue_description": "The uploaded photograph shows a scenic landscape or general view with no actionable municipal defect.",
                    "visual_indicators": ["Landscape / natural horizon detected", "No localized infrastructure damage"],
                    "suggested_severity": "LOW",
                    "image_quality": quality,
                    "uncertainty_reason": "No municipal defect identified in image",
                    "requires_human_confirmation": True,
                    "provider_used": "computer_vision_cv_engine",
                }

            # D. Clean road without damage (sky visible + high gray ratio + low localized depression)
            if sky > 0.12 and gray_ratio > 0.50 and bright_ratio < 0.03 and dark_ratio < 0.30:
                return {
                    "predicted_category": "UNCLEAR_OR_UNDETECTABLE",
                    "confidence_score": 0.30,
                    "issue_description": "The photograph displays an intact road surface without significant potholes, debris, or flooding.",
                    "visual_indicators": ["Normal asphalt carriageway", "No visible structural pothole crater"],
                    "suggested_severity": "LOW",
                    "image_quality": quality,
                    "uncertainty_reason": "Road surface appears clean and undamaged",
                    "requires_human_confirmation": True,
                    "provider_used": "computer_vision_cv_engine",
                }

        # -------------------------------------------------------------
        # STAGE 3: Classify Genuine Civic Problems
        # -------------------------------------------------------------
        # 1. Solid waste / Plastic garbage accumulation (detected first to prevent asphalt fallthrough)
        if is_waste_pattern:
            predicted = "GARBAGE_ACCUMULATION"
            confidence = round(min(0.96, 0.86 + (edge - 16.0) * 0.004 + (bright_ratio * 0.5)), 2)
            description = "Visible accumulation of uncollected municipal solid waste and plastic debris detected."
            indicators = ["High-frequency waste debris", "Plastic packaging clutter", "Pedestrian obstruction"]
            severity = "HIGH"

        # 2. Very dark, saturated puddle / pipeline breach
        elif dark_ratio > 0.45:
            predicted = "WATER_LEAKAGE"
            confidence = round(min(0.96, 0.88 + dark_ratio * 0.1), 2)
            description = "Active potable water pipeline discharge or localized surface water pooling detected."
            indicators = ["Water film reflection", "Ground water saturation", "Submerged surface"]
            severity = "HIGH"

        # 3. Flooded street / Waterlogging (moderate dark + reflective mid tones + low bright)
        elif dark_ratio > 0.20 and bright_ratio < 0.03 and edge > 15.0 and gray_ratio > 0.60:
            predicted = "WATERLOGGING"
            confidence = round(min(0.95, 0.88 + dark_ratio * 0.1), 2)
            description = "Monsoon street water accumulation and localized carriageway flooding detected."
            indicators = ["Submerged road pavement", "Reflective water surface", "Traffic obstruction"]
            severity = "HIGH"

        # 4. Pothole crater (High edge energy + dark depression on gray asphalt + low sky)
        elif edge > 10.0 and gray_ratio > 0.60 and (dark_ratio > 0.10 or block_var > 15.0):
            predicted = "POTHOLE"
            confidence = round(min(0.96, 0.88 + (block_var / 100.0) * 0.2), 2)
            description = "A visible pothole has been detected on the road surface. This creates vehicle damage and safety hazards."
            indicators = ["Damaged asphalt surface", "Depression crater", "Edge disintegration"]
            severity = "HIGH"

        # 5. Drainage culvert / canal obstruction
        elif dark_ratio > 0.25 and edge > 4.5:
            predicted = "DRAINAGE_BLOCKAGE"
            confidence = 0.90
            description = "Stormwater channel or sewer culvert obstruction with stagnant runoff detected."
            indicators = ["Culvert debris accumulation", "Sludge sedimentation", "Runoff stagnation"]
            severity = "HIGH"

        # 6. Streetlight / Electrical defects (warm luminaire tones or vertical post fixture)
        elif is_lamp_pattern:
            predicted = "BROKEN_STREETLIGHT"
            confidence = 0.88
            description = "Non-functional street illumination fixture or lamp defect creating public darkness."
            indicators = ["Luminaire enclosure defect", "Overhead pole structure", "Illumination failure"]
            severity = "MEDIUM"

        # 7. General road wear
        elif gray_ratio > 0.50 and edge > 7.0:
            predicted = "ROAD_DAMAGE"
            confidence = 0.85
            description = "Structural surface cracks and asphalt deterioration detected on carriageway."
            indicators = ["Asphalt wear", "Uneven road layer", "Surface fissures"]
            severity = "MEDIUM"

        else:
            predicted = "UNCLEAR_OR_UNDETECTABLE"
            confidence = 0.35
            description = "The visual evidence does not clearly match a standard civic defect."
            indicators = ["Inconclusive visual patterns"]
            severity = "LOW"

        return {
            "predicted_category": predicted,
            "confidence_score": confidence,
            "issue_description": description,
            "visual_indicators": indicators,
            "suggested_severity": severity,
            "image_quality": quality,
            "uncertainty_reason": None if predicted != "UNCLEAR_OR_UNDETECTABLE" else "Visual features inconclusive",
            "requires_human_confirmation": True,
            "provider_used": "computer_vision_cv_engine",
        }

    @classmethod
    def classify_grievance(
        cls,
        description: str,
        image_bytes: Optional[bytes] = None
    ) -> Dict[str, Any]:
        """Backward compatible classifier endpoint."""
        if image_bytes and len(image_bytes) > 200:
            analysis = cls.analyze_civic_image(image_bytes)
            cat_map = {
                "POTHOLE": "road_damage",
                "ROAD_DAMAGE": "road_damage",
                "DAMAGED_FOOTPATH": "road_damage",
                "GARBAGE_ACCUMULATION": "garbage_accumulation",
                "DRAINAGE_BLOCKAGE": "blocked_drainage",
                "WATER_LEAKAGE": "water_leakage",
                "WATERLOGGING": "waterlogging",
                "BROKEN_STREETLIGHT": "broken_streetlight",
                "DAMAGED_ELECTRIC_POLE": "damaged_electrical",
                "DAMAGED_PUBLIC_INFRASTRUCTURE": "other_civic",
                "OTHER_CIVIC_ISSUE": "other_civic",
                "UNCLEAR_OR_UNDETECTABLE": "other_civic",
            }
            db_code = cat_map.get(analysis["predicted_category"], "road_damage")
            return {
                "suggested_category": db_code,
                "detected_objects": [{"label": ind, "confidence": analysis["confidence_score"]} for ind in analysis["visual_indicators"]],
                "severity": analysis["suggested_severity"],
                "confidence": analysis["confidence_score"],
                "reason": analysis["issue_description"],
                "requires_human_review": analysis["requires_human_confirmation"],
            }

        desc_lower = description.lower() if description else ""
        if any(w in desc_lower for w in ["தண்ணீர்", "குடிநீர்", "கசிவு", "பைப்", "குழாய்", "water leakage", "water pipe", "pipe leak", "leakage"]):
            category = "water_leakage"
            severity = "HIGH"
            confidence = 0.93
            reason = "Detected active municipal water supply line breach with surface discharge."
        elif any(w in desc_lower for w in ["குப்பை", "கழிவு", "துர்நாற்றம்", "garbage", "trash", "waste", "litter"]):
            category = "garbage_accumulation"
            severity = "HIGH"
            confidence = 0.91
            reason = "Detected unsegregated municipal solid waste accumulation."
        elif any(w in desc_lower for w in ["சாக்கடை", "கழிவுநீர்", "வடிகால்", "drain", "drainage", "blocked", "sewer"]):
            category = "blocked_drainage"
            severity = "HIGH"
            confidence = 0.89
            reason = "Detected obstructed storm water canal with silt and plastic debris."
        elif any(w in desc_lower for w in ["விளக்கு", "தெருவிளக்கு", "இருட்டு", "streetlight", "street light", "lamp", "dark"]):
            category = "broken_streetlight"
            severity = "MEDIUM"
            confidence = 0.88
            reason = "Detected non-functional street luminaire fixture."
        elif any(w in desc_lower for w in ["மழைநீர்", "வெள்ளம்", "தேக்கம்", "waterlogging", "flood", "stagnant"]):
            category = "waterlogging"
            severity = "HIGH"
            confidence = 0.90
            reason = "Detected stagnant pool inundating road carriageway."
        elif any(w in desc_lower for w in ["குழி", "பள்ளம்", "ரோடு", "சாலை", "pothole", "potholes", "crack", "asphalt"]):
            category = "road_damage"
            severity = "HIGH"
            confidence = 0.94
            reason = "Detected asphalt road surface deterioration matching pothole pattern."
        else:
            category = "other_civic"
            severity = "LOW"
            confidence = 0.65
            reason = "General civic grievance requiring human departmental triage."

        return {
            "suggested_category": category,
            "detected_objects": [],
            "severity": severity,
            "confidence": confidence,
            "reason": reason,
            "requires_human_review": confidence < 0.75,
        }
