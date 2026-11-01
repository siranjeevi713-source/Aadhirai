"""
AADHIRAI Hybrid AI Orchestration Service
Fuses Hugging Face CivicAi-YOLO11m-v1 detection + Google Gemini Vision multimodal analysis.
Enforces deterministic category reconciliation, calibrated severity, and non-civic filtering.
"""
import time
import logging
from typing import Dict, Any, Optional
from PIL import Image

from preprocessing.image_processor import ImagePreprocessor
from inference.hf_detector import HFDetector
from inference.gemini_vision import GeminiVisionClient

logger = logging.getLogger("aadhirai.hybrid_orchestrator")

# Category metadata mapping
CATEGORY_DETAILS = {
    "POTHOLE": {
        "displayName": "Potholes / Road Cavities",
        "displayNameTa": "சாலைக் குழி",
        "defaultDepartment": "Roads & Infrastructure Department",
        "departmentCode": "dept_roads",
        "defaultSeverity": "HIGH"
    },
    "ROAD_DAMAGE": {
        "displayName": "Road Damage / Potholes",
        "displayNameTa": "சாலை சேதம் / விரிசல்",
        "defaultDepartment": "Roads & Infrastructure Department",
        "departmentCode": "dept_roads",
        "defaultSeverity": "HIGH"
    },
    "GARBAGE_ACCUMULATION": {
        "displayName": "Garbage Accumulation",
        "displayNameTa": "குப்பை குவிப்பு",
        "defaultDepartment": "Sanitation & Solid Waste Department",
        "departmentCode": "dept_sanitation",
        "defaultSeverity": "HIGH"
    },
    "DRAINAGE_BLOCKAGE": {
        "displayName": "Drainage Blockage",
        "displayNameTa": "வடிகால் அடைப்பு",
        "defaultDepartment": "Water Supply & Drainage Department",
        "departmentCode": "dept_water",
        "defaultSeverity": "HIGH"
    },
    "SEWAGE_OVERFLOW": {
        "displayName": "Sewage Overflow",
        "displayNameTa": "கழிவுநீர் பெருக்கெடுப்பு",
        "defaultDepartment": "Sanitation & Solid Waste Department",
        "departmentCode": "dept_sanitation",
        "defaultSeverity": "HIGH"
    },
    "WATER_LEAKAGE": {
        "displayName": "Water Pipeline Leakage",
        "displayNameTa": "குடிநீர் குழாய் கசிவு",
        "defaultDepartment": "Water Supply & Drainage Department",
        "departmentCode": "dept_water",
        "defaultSeverity": "HIGH"
    },
    "WATERLOGGING": {
        "displayName": "Waterlogging / Flooding",
        "displayNameTa": "மழைநீர் தேக்கம்",
        "defaultDepartment": "Water Supply & Drainage Department",
        "departmentCode": "dept_water",
        "defaultSeverity": "HIGH"
    },
    "BROKEN_STREETLIGHT": {
        "displayName": "Broken Streetlight / Electrical Defect",
        "displayNameTa": "பழுதான தெருவிளக்கு",
        "defaultDepartment": "Electrical Maintenance & Streetlighting",
        "departmentCode": "dept_electrical",
        "defaultSeverity": "MEDIUM"
    },
    "DAMAGED_PUBLIC_INFRASTRUCTURE": {
        "displayName": "Damaged Public Infrastructure",
        "displayNameTa": "பொதுக் கட்டமைப்பு சேதம்",
        "defaultDepartment": "Public Works & Infrastructure Department",
        "departmentCode": "dept_infrastructure",
        "defaultSeverity": "MEDIUM"
    },
    "FALLEN_TREE": {
        "displayName": "Fallen Tree / Branch Obstruction",
        "displayNameTa": "விழுந்த மரம்",
        "defaultDepartment": "Highways & Parks Department",
        "departmentCode": "dept_parks",
        "defaultSeverity": "HIGH"
    },
    "OTHER": {
        "displayName": "Other Civic Issue",
        "displayNameTa": "மற்றவை",
        "defaultDepartment": "Municipal General Administration",
        "departmentCode": "dept_general",
        "defaultSeverity": "MEDIUM"
    },
    "UNCLEAR": {
        "displayName": "Unclear / Inconclusive Evidence",
        "displayNameTa": "தெளிவற்றவை",
        "defaultDepartment": "Municipal General Administration",
        "departmentCode": "dept_general",
        "defaultSeverity": "LOW"
    },
    "NON_CIVIC_IMAGE": {
        "displayName": "Non-Civic Image (Invalid)",
        "displayNameTa": "பொதுப் பிரச்சனை அல்ல (செல்லுபடியாகாத படம்)",
        "defaultDepartment": "None (Not a Civic Issue)",
        "departmentCode": "none",
        "defaultSeverity": "NONE"
    }
}

class HybridOrchestrator:
    @classmethod
    def analyze(cls, image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """
        Full Hybrid Orchestration:
        1. Preprocess & Validate image.
        2. Hugging Face YOLO11m Object Detection.
        3. Gemini Vision Multimodal Inference.
        4. Reconcile predictions & calibrate output.
        """
        start_time = time.time()

        # Step 1: Preprocess and Quality Evaluation
        prep = ImagePreprocessor.preprocess_image(image_bytes)
        if not prep.get("is_valid"):
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "success": False,
                "analysis": {
                    "finalCategory": "NON_CIVIC_IMAGE",
                    "displayName": "Corrupted or Invalid Image",
                    "explanation": prep.get("reason", "Uploaded file could not be parsed as a valid image."),
                    "severity": "NONE",
                    "decisionStatus": "CORRUPTED_INPUT",
                    "needsCitizenConfirmation": True,
                    "isCivicIssue": False
                },
                "huggingFace": {
                    "model": HFDetector.MODEL_NAME,
                    "status": "SKIPPED",
                    "detections": []
                },
                "gemini": {
                    "model": "gemini-vision",
                    "status": "SKIPPED",
                    "category": None
                },
                "imageQuality": {
                    "isValid": False,
                    "quality": prep.get("quality", "CORRUPTED"),
                    "reasons": prep.get("quality_reasons", [])
                },
                "latencyMs": elapsed_ms
            }

        pil_img = prep["rgb_img"]

        # Step 2: Hugging Face Object Detection
        hf_detector = HFDetector.get_instance()
        hf_res = hf_detector.detect(pil_img, conf_threshold=0.15)

        # Step 3: Google Gemini Vision Analysis
        gemini_client = GeminiVisionClient.get_instance()
        gemini_res = gemini_client.analyze(image_bytes, mime_type=mime_type)

        # Step 4: Hybrid Decision Engine
        analysis = cls._reconcile(hf_res, gemini_res, prep)

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "success": True,
            "analysis": analysis,
            "huggingFace": hf_res,
            "gemini": gemini_res,
            "imageQuality": {
                "isValid": True,
                "quality": prep.get("quality", "GOOD"),
                "dimensions": {
                    "width": prep.get("width"),
                    "height": prep.get("height")
                },
                "entropy": round(prep.get("entropy", 0.0), 2),
                "reasons": prep.get("quality_reasons", [])
            },
            "suggestedDepartment": CATEGORY_DETAILS.get(analysis["finalCategory"], {}).get("defaultDepartment", "Municipal General Administration"),
            "suggestedDepartmentId": CATEGORY_DETAILS.get(analysis["finalCategory"], {}).get("departmentCode", "dept_general"),
            "latencyMs": elapsed_ms
        }

    @classmethod
    def _reconcile(
        cls,
        hf_res: Dict[str, Any],
        gemini_res: Dict[str, Any],
        prep: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Reconcile Hugging Face and Gemini predictions using deterministic priority rules.
        """
        hf_ok = hf_res.get("status") == "SUCCESS"
        gemini_ok = gemini_res.get("status") == "SUCCESS"

        hf_cat = hf_res.get("dominantClass")
        hf_conf = hf_res.get("maxConfidence", 0.0)
        hf_dets = hf_res.get("detections", [])

        gemini_cat = gemini_res.get("category")
        gemini_expl = gemini_res.get("explanation")
        gemini_evid = gemini_res.get("visibleEvidence", [])
        gemini_sev = gemini_res.get("severitySuggestion")
        gemini_unclear = gemini_res.get("isUnclear", False)
        gemini_civic = gemini_res.get("isCivic", True)

        # -----------------------------------------------------------------
        # STAGE 1: Non-Civic Image Filtering
        # -----------------------------------------------------------------
        if gemini_ok and (gemini_cat == "NON_CIVIC_IMAGE" or gemini_civic is False):
            # If HF has no high-confidence civic detections, accept non-civic rejection
            if hf_conf < 0.40:
                return {
                    "finalCategory": "NON_CIVIC_IMAGE",
                    "displayName": CATEGORY_DETAILS["NON_CIVIC_IMAGE"]["displayName"],
                    "displayNameTa": CATEGORY_DETAILS["NON_CIVIC_IMAGE"]["displayNameTa"],
                    "explanation": gemini_expl or "The uploaded photograph does not depict an actionable civic problem.",
                    "severity": "NONE",
                    "decisionStatus": "REJECTED_NON_CIVIC",
                    "needsCitizenConfirmation": True,
                    "visualEvidence": gemini_evid or ["Non-civic subject"],
                    "isCivicIssue": False,
                    "confidence": 0.15
                }

        # -----------------------------------------------------------------
        # STAGE 2: Both Models Available
        # -----------------------------------------------------------------
        if hf_ok and gemini_ok:
            # Compatible category mapping:
            # Pothole and Road Damage are related road surface issues
            road_set = {"POTHOLE", "ROAD_DAMAGE"}

            # Case A: Both agree exactly or within same domain
            if hf_cat == gemini_cat or (hf_cat in road_set and gemini_cat in road_set):
                chosen_cat = gemini_cat if gemini_cat in road_set else (hf_cat or gemini_cat)
                details = CATEGORY_DETAILS.get(chosen_cat, CATEGORY_DETAILS["ROAD_DAMAGE"])
                return {
                    "finalCategory": chosen_cat,
                    "displayName": details["displayName"],
                    "displayNameTa": details["displayNameTa"],
                    "explanation": gemini_expl or f"Verified {details['displayName'].lower()} detected by both vision models.",
                    "severity": gemini_sev or details["defaultSeverity"],
                    "decisionStatus": "CONFIRMED_BY_MODELS",
                    "needsCitizenConfirmation": False,
                    "visualEvidence": gemini_evid or [f"{len(hf_dets)} defect bounding boxes localized"],
                    "isCivicIssue": True,
                    "confidence": max(hf_conf, 0.90)
                }

            # Case B: Disagreement
            # 1. Gemini detected an infrastructure category outside HF's 3 classes
            # (Water, Drainage, Streetlight, Fallen Tree, etc.)
            hf_road_garbage = {"POTHOLE", "ROAD_DAMAGE", "GARBAGE_ACCUMULATION"}
            if gemini_cat not in hf_road_garbage and gemini_cat in CATEGORY_DETAILS:
                # If HF detected no strong road or garbage defect
                if hf_conf < 0.35:
                    details = CATEGORY_DETAILS.get(gemini_cat, CATEGORY_DETAILS["OTHER"])
                    return {
                        "finalCategory": gemini_cat,
                        "displayName": details["displayName"],
                        "displayNameTa": details["displayNameTa"],
                        "explanation": gemini_expl or f"{details['displayName']} identified by multimodal vision.",
                        "severity": gemini_sev or details["defaultSeverity"],
                        "decisionStatus": "CONFIRMED_BY_GEMINI_DOMAIN",
                        "needsCitizenConfirmation": True,
                        "visualEvidence": gemini_evid,
                        "isCivicIssue": True,
                        "confidence": 0.88
                    }

            # 2. Conflicting Road vs Garbage:
            # E.g. HF says Road Damage / Pothole, but Gemini says Garbage, or vice versa
            if hf_cat in road_set and gemini_cat == "GARBAGE_ACCUMULATION":
                # If HF has strong localized road damage / pothole boxes
                if hf_conf >= 0.30:
                    details = CATEGORY_DETAILS["ROAD_DAMAGE"]
                    return {
                        "finalCategory": "ROAD_DAMAGE",
                        "displayName": details["displayName"],
                        "displayNameTa": details["displayNameTa"],
                        "explanation": f"Structural road surface deterioration and potholes verified by YOLO object detection. (Gemini noted possible surface debris: {gemini_expl})",
                        "severity": "HIGH",
                        "decisionStatus": "RESOLVED_BY_DETECTION_EVIDENCE",
                        "needsCitizenConfirmation": True,
                        "visualEvidence": [f"{len(hf_dets)} road damage / pothole regions identified"] + gemini_evid,
                        "isCivicIssue": True,
                        "confidence": hf_conf
                    }

            if hf_cat == "GARBAGE_ACCUMULATION" and gemini_cat in road_set:
                # If Gemini verified broken asphalt / road cracks
                details = CATEGORY_DETAILS.get(gemini_cat, CATEGORY_DETAILS["ROAD_DAMAGE"])
                return {
                    "finalCategory": gemini_cat,
                    "displayName": details["displayName"],
                    "displayNameTa": details["displayNameTa"],
                    "explanation": gemini_expl or "Road surface defect with potential localized waste.",
                    "severity": gemini_sev or "HIGH",
                    "decisionStatus": "NEEDS_REVIEW",
                    "needsCitizenConfirmation": True,
                    "visualEvidence": gemini_evid + [f"{len(hf_dets)} localized waste detections"],
                    "isCivicIssue": True,
                    "confidence": 0.75
                }

            # Generic disagreement fallback: Needs Review
            details = CATEGORY_DETAILS.get(gemini_cat or hf_cat or "OTHER", CATEGORY_DETAILS["OTHER"])
            return {
                "finalCategory": gemini_cat or hf_cat or "OTHER",
                "displayName": details["displayName"],
                "displayNameTa": details["displayNameTa"],
                "explanation": f"Discrepancy detected between AI models (HF: {hf_cat}, Gemini: {gemini_cat}). Please verify the category.",
                "severity": gemini_sev or details["defaultSeverity"],
                "decisionStatus": "NEEDS_REVIEW",
                "needsCitizenConfirmation": True,
                "visualEvidence": gemini_evid,
                "isCivicIssue": True,
                "confidence": 0.65
            }

        # -----------------------------------------------------------------
        # STAGE 3: Single Model Available (HF only or Gemini only)
        # -----------------------------------------------------------------
        if hf_ok and not gemini_ok:
            if hf_cat and hf_conf >= 0.20:
                details = CATEGORY_DETAILS.get(hf_cat, CATEGORY_DETAILS["ROAD_DAMAGE"])
                return {
                    "finalCategory": hf_cat,
                    "displayName": details["displayName"],
                    "displayNameTa": details["displayNameTa"],
                    "explanation": f"Civic defect detected by Hugging Face CivicAi-YOLO11m-v1 with {len(hf_dets)} localized regions.",
                    "severity": details["defaultSeverity"],
                    "decisionStatus": "CONFIRMED_BY_HUGGINGFACE_YOLO",
                    "needsCitizenConfirmation": True,
                    "visualEvidence": [f"{box['className']} (conf: {box['confidence']})" for box in hf_dets],
                    "isCivicIssue": True,
                    "confidence": hf_conf
                }
            else:
                return {
                    "finalCategory": "UNCLEAR",
                    "displayName": CATEGORY_DETAILS["UNCLEAR"]["displayName"],
                    "displayNameTa": CATEGORY_DETAILS["UNCLEAR"]["displayNameTa"],
                    "explanation": "No distinct potholes, road damage or garbage detected by YOLO. Please verify category manually.",
                    "severity": "LOW",
                    "decisionStatus": "LOW_CONFIDENCE",
                    "needsCitizenConfirmation": True,
                    "visualEvidence": ["No high-confidence detections"],
                    "isCivicIssue": True,
                    "confidence": 0.30
                }

        if gemini_ok and not hf_ok:
            details = CATEGORY_DETAILS.get(gemini_cat, CATEGORY_DETAILS["OTHER"])
            return {
                "finalCategory": gemini_cat or "OTHER",
                "displayName": details["displayName"],
                "displayNameTa": details["displayNameTa"],
                "explanation": gemini_expl or "Analysis provided by Gemini Vision.",
                "severity": gemini_sev or details["defaultSeverity"],
                "decisionStatus": "CONFIRMED_BY_GEMINI",
                "needsCitizenConfirmation": True,
                "visualEvidence": gemini_evid,
                "isCivicIssue": gemini_civic if gemini_civic is not None else True,
                "confidence": 0.85 if not gemini_unclear else 0.40
            }

        # -----------------------------------------------------------------
        # STAGE 4: Both Models Unavailable
        # -----------------------------------------------------------------
        return {
            "finalCategory": "UNCLEAR",
            "displayName": "AI Service Unavailable",
            "displayNameTa": "செயற்கை நுண்ணறிவு சேவை கிடைக்கவில்லை",
            "explanation": "Both Hugging Face YOLO and Gemini Vision services are currently unavailable. Please select your complaint category manually.",
            "severity": "LOW",
            "decisionStatus": "SERVICE_UNAVAILABLE",
            "needsCitizenConfirmation": True,
            "visualEvidence": [],
            "isCivicIssue": True,
            "confidence": 0.0
        }
