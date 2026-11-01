"""
Civic Image Classification Engine v2.2
Computer Vision & Multimodal Civic Inspection Pipeline
Accurately distinguishes genuine civic infrastructure defects from non-civic / unrelated images.
Uses PIL and NumPy (optimized for Python 3.14 without binary C dependencies).
"""
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image

CIVIC_DEPARTMENTS = {
    "GARBAGE_ACCUMULATION": "Sanitation & Solid Waste Management",
    "POTHOLE": "Roads & Infrastructure Department",
    "ROAD_DAMAGE": "Roads & Infrastructure Department",
    "DRAINAGE_BLOCKAGE": "Sanitation & Solid Waste Management",
    "SEWAGE_OVERFLOW": "Sanitation & Solid Waste Management",
    "WATER_LEAKAGE": "Water Supply & Drainage Department",
    "WATERLOGGING": "Water Supply & Drainage Department",
    "BROKEN_STREETLIGHT": "Electrical Maintenance & Streetlighting",
    "DAMAGED_PUBLIC_INFRASTRUCTURE": "Public Works & Infrastructure Department",
    "FALLEN_TREE": "Highways & Parks Department",
    "OTHER / UNCLEAR": "Municipal General Administration",
    "NON_CIVIC_IMAGE": "None (Not a Civic Issue)",
}

CIVIC_CATEGORIES_TA = {
    "GARBAGE_ACCUMULATION": "குப்பை குவிப்பு",
    "POTHOLE": "சாலைக் குழி",
    "ROAD_DAMAGE": "சாலை சேதம் / விரிசல்",
    "DRAINAGE_BLOCKAGE": "வடிகால் அடைப்பு",
    "SEWAGE_OVERFLOW": "கழிவுநீர் பெருக்கெடுப்பு",
    "WATER_LEAKAGE": "குடிநீர் குழாய் கசிவு",
    "WATERLOGGING": "மழைநீர் தேக்கம்",
    "BROKEN_STREETLIGHT": "பழுதான தெருவிளக்கு",
    "DAMAGED_PUBLIC_INFRASTRUCTURE": "பொதுக் கட்டமைப்பு சேதம்",
    "FALLEN_TREE": "விழுந்த மரம்",
    "OTHER / UNCLEAR": "மற்றவை / தெளிவற்றவை",
    "NON_CIVIC_IMAGE": "பொதுப் பிரச்சனை அல்ல (செல்லுபடியாகாத படம்)",
}

class CivicClassifier:
    MODEL_VERSION = "2.2.0-civic-vision-guard"

    @classmethod
    def extract_features(cls, rgb_img: Image.Image, gray_img: Image.Image) -> Dict[str, Any]:
        """Compute visual, spatial, and luminance features for civic vs non-civic discrimination."""
        arr_rgb = np.array(rgb_img, dtype=np.float32)
        gray = np.array(gray_img, dtype=np.float32)

        # Gradients & Edge Energy
        diff_y = np.abs(gray[1:, :] - gray[:-1, :])
        diff_x = np.abs(gray[:, 1:] - gray[:, :-1])
        edge_energy = float(np.mean(diff_y) + np.mean(diff_x))
        quality = "EXCELLENT" if edge_energy > 12.0 else ("FAIR" if edge_energy > 5.0 else "BLURRY")

        # Color channels
        r = arr_rgb[:, :, 0]
        g = arr_rgb[:, :, 1]
        b = arr_rgb[:, :, 2]

        r_mean = float(np.mean(r))
        g_mean = float(np.mean(g))
        b_mean = float(np.mean(b))

        # HSV saturation and value
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

        # Skin tones for portrait/person rejection
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
                "isCivicIssue": False,
                "is_civic_issue": False,
                "predictedCategory": "NON_CIVIC_IMAGE",
                "predicted_category": "NON_CIVIC_IMAGE",
                "confidence": 0.0,
                "confidence_score": 0.0,
                "quality": preprocessed_info.get("quality", "CORRUPTED"),
                "image_quality": preprocessed_info.get("quality", "CORRUPTED"),
                "isUnclear": True,
                "is_unclear": True,
                "explanation": preprocessed_info.get("reason", "Corrupted or unreadable image file. Please upload a clear photo."),
                "issue_description": preprocessed_info.get("reason", "Corrupted or unreadable image file. Please upload a clear photo."),
                "suggestedSeverity": "NONE",
                "suggested_severity": "NONE",
                "suggestedDepartment": "NONE",
                "suggested_department": "NONE",
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

        # -------------------------------------------------------------
        # STAGE 1: Featureless / Low-Entropy / Blurry / Blank Images
        # -------------------------------------------------------------
        if edge < 2.5 or (mid_gray < 0.05 and dark_ratio < 0.05 and bright_ratio > 0.85):
            return cls._format_response(
                category="NON_CIVIC_IMAGE",
                confidence=0.15,
                quality="BLURRY",
                is_unclear=True,
                is_civic=False,
                explanation="The uploaded photograph is blank, featureless, or too blurry to identify any civic infrastructure problem. Please upload a clear photograph of the civic defect.",
                severity="NONE"
            )

        # -------------------------------------------------------------
        # Distinctive Civic Signal Checks before negative filtering
        # -------------------------------------------------------------
        # Solid waste: high edge energy, multi-color packaging highlights, localized street debris
        is_waste_pattern = ((edge > 16.0 and bright_ratio > 0.035 and sat > 0.10 and rgb_std > 5.0) or (edge > 15.0 and bright_ratio > 0.08)) and sky < 0.25
        # Streetlight: luminaire warm glow, enclosure tone, or high overhead fixture contrast
        is_lamp_pattern = (r_m > g_m + 35 and r_m > b_m + 35) or (edge < 6.0 and dark_ratio > 0.12 and block_var > 25.0)

        # -------------------------------------------------------------
        # STAGE 2: Filter Non-Civic / Unrelated Images (People, Food, Animals, Landscapes, Documents)
        # -------------------------------------------------------------
        if not is_waste_pattern and not is_lamp_pattern:
            # A. Person portrait / Selfie / High skin tones
            if (skin > 0.10 and gray_ratio < 0.30) or (skin > 0.18):
                return cls._format_response(
                    category="NON_CIVIC_IMAGE",
                    confidence=0.15,
                    quality=quality,
                    is_unclear=True,
                    is_civic=False,
                    explanation="The uploaded photo appears to be a portrait, selfie, or person photo. Non-civic personal photos cannot be submitted as municipal grievances. Please upload a photo of the civic defect.",
                    severity="NONE"
                )

            # B. Food, dishes, high-saturation non-infrastructure domestic items
            if sat > 0.22 and rgb_std > 16.0 and gray_ratio < 0.15:
                return cls._format_response(
                    category="NON_CIVIC_IMAGE",
                    confidence=0.15,
                    quality=quality,
                    is_unclear=True,
                    is_civic=False,
                    explanation="The uploaded photo contains domestic objects, food, or interior items with no municipal infrastructure. Non-civic images cannot be routed to municipal departments.",
                    severity="NONE"
                )

            # C. Nature scenery / Landscape / Animals / Sky dominance
            if (sky > 0.25 and gray_ratio < 0.30) or (rgb_std > 20.0 and gray_ratio < 0.20):
                return cls._format_response(
                    category="NON_CIVIC_IMAGE",
                    confidence=0.20,
                    quality=quality,
                    is_unclear=True,
                    is_civic=False,
                    explanation="The uploaded photo shows a scenic landscape or natural scene with no actionable municipal infrastructure defect. Please upload a photo of a civic problem (pothole, garbage, water leak, etc.).",
                    severity="NONE"
                )

            # D. Clean road without any defect
            if sky > 0.12 and gray_ratio > 0.50 and bright_ratio < 0.03 and dark_ratio < 0.30 and edge < 9.0:
                return cls._format_response(
                    category="NON_CIVIC_IMAGE",
                    confidence=0.25,
                    quality=quality,
                    is_unclear=True,
                    is_civic=False,
                    explanation="The photograph displays an intact, clean road surface without significant potholes, debris, or flooding. No actionable civic defect detected.",
                    severity="NONE"
                )

        # -------------------------------------------------------------
        # STAGE 3: Classify Genuine Civic Problems Accurately
        # -------------------------------------------------------------
        # 1. Solid waste / Plastic garbage accumulation (Sanitation Dept)
        if is_waste_pattern:
            conf = min(0.96, 0.86 + (edge - 16.0) * 0.004 + (bright_ratio * 0.5))
            return cls._format_response(
                category="GARBAGE_ACCUMULATION",
                confidence=conf,
                quality=quality,
                is_unclear=False,
                is_civic=True,
                explanation="Visible accumulation of uncollected municipal solid waste and plastic debris detected.",
                severity="HIGH"
            )

        # 2. Water leakage (active pipeline breach / heavy pooling - Water Dept)
        if dark_ratio > 0.45:
            conf = min(0.96, 0.88 + dark_ratio * 0.1)
            return cls._format_response(
                category="WATER_LEAKAGE",
                confidence=conf,
                quality=quality,
                is_unclear=False,
                is_civic=True,
                explanation="Active potable water pipeline leakage or severe localized water pooling detected.",
                severity="HIGH"
            )

        # 3. Waterlogging (flooded street carriageway - Water Dept)
        if dark_ratio > 0.20 and bright_ratio < 0.03 and edge > 15.0 and gray_ratio > 0.60:
            conf = min(0.95, 0.88 + dark_ratio * 0.1)
            return cls._format_response(
                category="WATERLOGGING",
                confidence=conf,
                quality=quality,
                is_unclear=False,
                is_civic=True,
                explanation="Monsoon street water accumulation and localized carriageway flooding detected.",
                severity="HIGH"
            )

        # 4. Pothole (localized asphalt crater - Roads Dept)
        if edge > 10.0 and gray_ratio > 0.60 and (dark_ratio > 0.10 or block_var > 15.0):
            conf = min(0.96, 0.88 + (block_var / 100.0) * 0.2)
            return cls._format_response(
                category="POTHOLE",
                confidence=conf,
                quality=quality,
                is_unclear=False,
                is_civic=True,
                explanation="A visible pothole detected on the road surface creating hazard for vehicles and pedestrians.",
                severity="HIGH"
            )

        # 5. Drainage culvert / canal obstruction (Sanitation / Drainage Dept)
        if dark_ratio > 0.25 and edge > 4.5:
            return cls._format_response(
                category="DRAINAGE_BLOCKAGE",
                confidence=0.90,
                quality=quality,
                is_unclear=False,
                is_civic=True,
                explanation="Stormwater channel or sewer culvert obstruction with stagnant runoff detected.",
                severity="HIGH"
            )

        # 6. Streetlight / Electrical defects (Electrical Dept)
        if is_lamp_pattern:
            return cls._format_response(
                category="BROKEN_STREETLIGHT",
                confidence=0.88,
                quality=quality,
                is_unclear=False,
                is_civic=True,
                explanation="Non-functional street illumination fixture or lamp defect creating public darkness.",
                severity="MEDIUM"
            )

        # 7. Road damage (cracks, alligator fissures, asphalt erosion - Roads Dept)
        if gray_ratio > 0.50 and edge > 7.0:
            return cls._format_response(
                category="ROAD_DAMAGE",
                confidence=0.85,
                quality=quality,
                is_unclear=False,
                is_civic=True,
                explanation="Structural surface cracks and asphalt deterioration detected on carriageway.",
                severity="MEDIUM"
            )

        # Default fallback: Unclear / Non-civic
        return cls._format_response(
            category="NON_CIVIC_IMAGE",
            confidence=0.25,
            quality=quality,
            is_unclear=True,
            is_civic=False,
            explanation="The visual evidence does not clearly match any actionable municipal infrastructure defect. Please upload a clear photo of the civic defect.",
            severity="NONE"
        )

    @classmethod
    def _format_response(
        cls,
        category: str,
        confidence: float,
        quality: str,
        is_unclear: bool,
        explanation: str,
        severity: str,
        is_civic: bool = True
    ) -> Dict[str, Any]:
        dept = CIVIC_DEPARTMENTS.get(category, "Municipal General Administration") if is_civic else "NONE"
        category_ta = CIVIC_CATEGORIES_TA.get(category, "")
        return {
            "success": True,
            "isCivicIssue": is_civic,
            "is_civic_issue": is_civic,
            "predictedCategory": category,
            "predicted_category": category,
            "categoryNameTa": category_ta,
            "category_name_ta": category_ta,
            "confidence": round(confidence, 2),
            "confidence_score": round(confidence, 2),
            "quality": quality,
            "image_quality": quality,
            "isUnclear": is_unclear,
            "is_unclear": is_unclear,
            "explanation": explanation,
            "issue_description": explanation,
            "suggestedSeverity": severity,
            "suggested_severity": severity,
            "suggestedDepartment": dept,
            "suggested_department": dept,
            "modelVersion": cls.MODEL_VERSION,
            "requires_human_confirmation": True
        }
