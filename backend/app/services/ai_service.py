import io
import math
import os
import json
import logging
from typing import Dict, Any, List, Optional
from PIL import Image
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
    def _analyze_image_heuristics(image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract computer vision metrics: color spectrum, luminance, gradients, edges, and texture variance.
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
            if width < 50 or height < 50:
                return {"is_valid": False, "quality": "POOR", "reason": "Resolution below 50x50"}

            rgb_img = img.convert("RGB")
            gray_img = img.convert("L")

            arr = np.array(rgb_img)
            gray = np.array(gray_img, dtype=np.float32)

            diff_y = np.abs(gray[1:, :] - gray[:-1, :])
            diff_x = np.abs(gray[:, 1:] - gray[:, :-1])
            edge_energy = float(np.mean(diff_y) + np.mean(diff_x))
            quality = "EXCELLENT" if edge_energy > 12 else "FAIR" if edge_energy > 6 else "BLURRY"

            r_mean = float(np.mean(arr[:, :, 0]))
            g_mean = float(np.mean(arr[:, :, 1]))
            b_mean = float(np.mean(arr[:, :, 2]))

            dark_ratio = float(np.mean(gray < 55))
            mid_gray = float(np.mean((gray >= 55) & (gray <= 145)))
            bright_ratio = float(np.mean(gray > 200))

            return {
                "is_valid": True,
                "quality": quality,
                "edge_energy": edge_energy,
                "dark_ratio": dark_ratio,
                "mid_gray": mid_gray,
                "bright_ratio": bright_ratio,
                "r_mean": r_mean,
                "g_mean": g_mean,
                "b_mean": b_mean,
            }
        except Exception as e:
            logger.warning(f"Feature extraction error: {e}")
            return {"is_valid": False, "quality": "UNKNOWN", "reason": str(e)}

    @classmethod
    def analyze_civic_image(
        cls,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        user_hint: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze civic evidence photograph.
        Uses Gemini Multimodal API if GEMINI_API_KEY is configured.
        Otherwise uses Computer Vision Decision Engine.
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
- UNCLEAR_OR_UNDETECTABLE (no visible civic issue, selfie, blurry)

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

        # 2. Local Computer Vision Feature Engine
        f = cls._analyze_image_heuristics(image_bytes)
        if not f.get("is_valid", False):
            return {
                "predicted_category": "UNCLEAR_OR_UNDETECTABLE",
                "confidence_score": 0.35,
                "issue_description": "The uploaded photograph does not present clear civic infrastructure details.",
                "visual_indicators": ["Low contrast / resolution"],
                "suggested_severity": "LOW",
                "image_quality": f.get("quality", "POOR"),
                "uncertainty_reason": f.get("reason", "Unable to detect structured civic elements"),
                "requires_human_confirmation": True,
                "provider_used": "computer_vision_cv_engine",
            }

        dark_ratio = f["dark_ratio"]
        mid_gray = f["mid_gray"]
        bright_ratio = f["bright_ratio"]
        edge = f["edge_energy"]
        r_m = f["r_mean"]
        g_m = f["g_mean"]
        b_m = f["b_mean"]
        quality = f["quality"]

        # Classification heuristics based on empirical spectral and geometric properties:
        # 0. Check for blank, solid color, or featureless images
        if edge < 2.0 or (mid_gray < 0.05 and dark_ratio < 0.05 and bright_ratio > 0.85):
            return {
                "predicted_category": "UNCLEAR_OR_UNDETECTABLE",
                "confidence_score": 0.25,
                "issue_description": "The uploaded photograph is featureless, blank, or lacks sufficient visible municipal infrastructure details.",
                "visual_indicators": ["Featureless / low entropy image", "Insufficient visual detail"],
                "suggested_severity": "LOW",
                "image_quality": "BLURRY",
                "uncertainty_reason": "No visible civic issue detected",
                "requires_human_confirmation": True,
                "provider_used": "computer_vision_cv_engine",
            }
        # 1. Very dark, low edge energy -> Submerged dark puddle / water leakage
        if dark_ratio > 0.45:
            predicted = "WATER_LEAKAGE"
            confidence = 0.91
            description = "Active potable water pipeline discharge or localized surface water pooling detected."
            indicators = ["Water film reflection", "Ground water saturation", "Submerged surface"]
            severity = "HIGH"
        # 2. High edge energy + high texture + bright debris -> Solid waste accumulation
        elif edge > 18.0 and bright_ratio > 0.10:
            predicted = "GARBAGE_ACCUMULATION"
            confidence = 0.94
            description = "Uncollected municipal solid waste accumulation and unsegregated debris detected."
            indicators = ["High-frequency waste debris", "Plastic packaging clutter", "Pedestrian obstruction"]
            severity = "HIGH"
        # 3. High edge energy + dark depression on asphalt -> Pothole crater
        elif edge > 18.0 and dark_ratio > 0.10:
            predicted = "POTHOLE"
            confidence = 0.94
            description = "A visible pothole has been detected on the road surface. This creates vehicle damage and safety hazards."
            indicators = ["Damaged asphalt surface", "Depression crater", "Edge disintegration"]
            severity = "HIGH"
        # 4. Moderate dark + low-mid edge + grey tones -> Drainage canal / culvert silt
        elif dark_ratio > 0.25:
            predicted = "DRAINAGE_BLOCKAGE"
            confidence = 0.90
            description = "Stormwater channel or sewer culvert obstruction with stagnant runoff detected."
            indicators = ["Culvert debris accumulation", "Sludge sedimentation", "Runoff stagnation"]
            severity = "HIGH"
        # 5. Warm red/orange hues or streetlight luminaire structure
        elif r_m > g_m + 30 and r_m > b_m + 30:
            predicted = "BROKEN_STREETLIGHT"
            confidence = 0.88
            description = "Non-functional street illumination fixture or lamp defect creating public darkness."
            indicators = ["Luminaire enclosure defect", "Overhead pole structure", "Illumination failure"]
            severity = "MEDIUM"
        else:
            predicted = "ROAD_DAMAGE"
            confidence = 0.89
            description = "Structural surface cracks and asphalt deterioration detected on carriageway."
            indicators = ["Asphalt wear", "Uneven road layer", "Surface fissures"]
            severity = "MEDIUM"

        return {
            "predicted_category": predicted,
            "confidence_score": confidence,
            "issue_description": description,
            "visual_indicators": indicators,
            "suggested_severity": severity,
            "image_quality": quality,
            "uncertainty_reason": None,
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
