"""
Google Gemini Vision Multimodal Inspection Service
Uses official google.genai SDK.
"""
import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("aadhirai.gemini_vision")

SUPPORTED_CIVIC_CATEGORIES = [
    "POTHOLE",
    "ROAD_DAMAGE",
    "GARBAGE_ACCUMULATION",
    "DRAINAGE_BLOCKAGE",
    "SEWAGE_OVERFLOW",
    "WATER_LEAKAGE",
    "WATERLOGGING",
    "BROKEN_STREETLIGHT",
    "DAMAGED_PUBLIC_INFRASTRUCTURE",
    "FALLEN_TREE",
    "OTHER",
    "UNCLEAR"
]

class GeminiVisionClient:
    _instance: Optional["GeminiVisionClient"] = None

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self.model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
        self._client = None

        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"Gemini client initialized with model {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize google.genai client: {e}")
                self._client = None
        else:
            logger.info("GEMINI_API_KEY not configured. Gemini Vision will be marked UNAVAILABLE.")

    @classmethod
    def get_instance(cls) -> "GeminiVisionClient":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def is_available(self) -> bool:
        return bool(self.api_key and self._client is not None)

    def analyze(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """
        Analyze image bytes with Gemini Vision API.
        Returns validated structured civic analysis.
        """
        # Re-check API key dynamically in case environment variable was updated
        current_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if current_key and (not self.api_key or self._client is None):
            self.api_key = current_key
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Dynamic Gemini client init failed: {e}")

        if not self.is_available:
            return {
                "status": "UNAVAILABLE",
                "model": self.model_name,
                "error": "GEMINI_API_KEY environment variable is not configured",
                "category": None,
                "explanation": None,
                "visibleEvidence": [],
                "severitySuggestion": None,
                "isUnclear": True,
                "alternativeCategory": None,
                "isCivic": None
            }

        prompt = f"""You are an automated civic infrastructure defect analysis AI for municipal corporations.
Analyze the uploaded photograph of a street or municipal site carefully and objectively.
Classify the visual scene strictly into ONE of the following categories:
{', '.join(SUPPORTED_CIVIC_CATEGORIES)}, or NON_CIVIC_IMAGE (if the image shows people, selfies, pets, documents, food, indoor furniture, or clean scenery with no civic defect).

Requirements:
1. Examine what is ACTUALLY visible in the image bytes (asphalt surface, potholes, water pooling, uncollected garbage, etc.).
2. If the image depicts damaged asphalt, craters, or cracks, classify as ROAD_DAMAGE or POTHOLE. Do NOT call damaged asphalt garbage.
3. If the image depicts solid waste, plastics, or refuse bags, classify as GARBAGE_ACCUMULATION.
4. Do NOT invent or predict GPS coordinates, district names, ward numbers, or specific landmarks.
5. Return strictly valid JSON with no markdown wrapping:
{{
  "category": "ROAD_DAMAGE",
  "explanation": "Detailed objective description of the defect visible in the image.",
  "visible_evidence": ["Evidence 1", "Evidence 2"],
  "severity_suggestion": "HIGH",
  "is_unclear": false,
  "alternative_category": "POTHOLE",
  "is_civic": true
}}"""

        try:
            from google.genai import types
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt
                ]
            )

            if not response or not response.text:
                return {
                    "status": "ERROR",
                    "model": self.model_name,
                    "error": "Empty response from Gemini API",
                    "category": None,
                    "explanation": None,
                    "visibleEvidence": [],
                    "severitySuggestion": None,
                    "isUnclear": True,
                    "alternativeCategory": None,
                    "isCivic": None
                }

            text = response.text.strip()
            # Clean markdown formatting if present
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

            parsed = json.loads(text)

            cat = str(parsed.get("category", "UNCLEAR")).upper().strip()
            # Canonicalize category
            if cat not in SUPPORTED_CIVIC_CATEGORIES and cat != "NON_CIVIC_IMAGE":
                cat = "OTHER"

            return {
                "status": "SUCCESS",
                "model": self.model_name,
                "category": cat,
                "explanation": parsed.get("explanation", ""),
                "visibleEvidence": parsed.get("visible_evidence", []),
                "severitySuggestion": parsed.get("severity_suggestion", "MEDIUM"),
                "isUnclear": bool(parsed.get("is_unclear", False)),
                "alternativeCategory": parsed.get("alternative_category"),
                "isCivic": bool(parsed.get("is_civic", cat != "NON_CIVIC_IMAGE" and cat != "UNCLEAR"))
            }
        except Exception as e:
            logger.error(f"Gemini API inference error: {e}")
            return {
                "status": "ERROR",
                "model": self.model_name,
                "error": str(e),
                "category": None,
                "explanation": None,
                "visibleEvidence": [],
                "severitySuggestion": None,
                "isUnclear": True,
                "alternativeCategory": None,
                "isCivic": None
            }
