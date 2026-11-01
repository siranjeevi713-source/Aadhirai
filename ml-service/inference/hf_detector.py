"""
Hugging Face Civic Issue Object Detector
Model: CivicAi-YOLO11m-v1
Repository: Aryansahay/Pothole
Weights: Vision Classification.pt

Classes:
  0: pothole
  1: road_damage
  2: garbage
"""
import os
import logging
from typing import Dict, Any, List, Optional
from PIL import Image
from ultralytics import YOLO

logger = logging.getLogger("aadhirai.hf_detector")

CLASS_MAPPING = {
    0: "POTHOLE",
    1: "ROAD_DAMAGE",
    2: "GARBAGE_ACCUMULATION"
}

DISPLAY_NAMES = {
    "POTHOLE": "Pothole",
    "ROAD_DAMAGE": "Road Damage",
    "GARBAGE_ACCUMULATION": "Garbage Accumulation"
}

class HFDetector:
    _instance: Optional["HFDetector"] = None
    _model: Optional[YOLO] = None
    MODEL_NAME = "CivicAi-YOLO11m-v1"
    REPO_ID = "Aryansahay/Pothole"

    def __init__(self, weights_path: Optional[str] = None):
        if weights_path is None:
            # Check local weights folder first
            local_weights = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "weights",
                "Vision Classification.pt"
            )
            if os.path.exists(local_weights):
                weights_path = local_weights
            else:
                # Try downloading or loading via huggingface_hub
                try:
                    from huggingface_hub import hf_hub_download
                    weights_path = hf_hub_download(
                        repo_id=self.REPO_ID,
                        filename="Vision Classification.pt"
                    )
                except Exception as e:
                    logger.error(f"Failed to download model weights from {self.REPO_ID}: {e}")
                    weights_path = None

        if weights_path and os.path.exists(weights_path):
            try:
                logger.info(f"Loading YOLO model from {weights_path}...")
                self._model = YOLO(weights_path)
                logger.info(f"Loaded {self.MODEL_NAME} successfully. Classes: {self._model.names}")
            except Exception as e:
                logger.error(f"Failed to load YOLO model: {e}")
                self._model = None
        else:
            logger.warning(f"No valid weights found at {weights_path}")
            self._model = None

    @classmethod
    def get_instance(cls) -> "HFDetector":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def detect(self, image: Image.Image, conf_threshold: float = 0.15) -> Dict[str, Any]:
        """
        Run inference on PIL Image.
        Returns detection list, counts, dominant class, and max confidence.
        """
        if self._model is None:
            return {
                "status": "UNAVAILABLE",
                "model": self.MODEL_NAME,
                "error": "Model weights not loaded or failed initialization",
                "detections": [],
                "dominantClass": None,
                "maxConfidence": 0.0,
                "counts": {}
            }

        try:
            results = self._model(image, imgsz=768, conf=conf_threshold, verbose=False)
            boxes = results[0].boxes
            class_names = self._model.names

            detections: List[Dict[str, Any]] = []
            counts: Dict[str, int] = {}
            max_conf = 0.0
            dominant_class = None

            for box in boxes:
                cls_id = int(box.cls)
                cls_name = class_names.get(cls_id, str(cls_id))
                canonical_cat = CLASS_MAPPING.get(cls_id, "OTHER")
                conf = float(box.conf)
                xyxy = [round(float(coord), 2) for coord in box.xyxy[0].tolist()]

                if conf > max_conf:
                    max_conf = conf
                    dominant_class = canonical_cat

                counts[cls_name] = counts.get(cls_name, 0) + 1

                detections.append({
                    "classId": cls_id,
                    "className": cls_name,
                    "canonicalCategory": canonical_cat,
                    "confidence": round(conf, 4),
                    "bbox": xyxy
                })

            return {
                "status": "SUCCESS",
                "model": self.MODEL_NAME,
                "detections": detections,
                "detectionCount": len(detections),
                "dominantClass": dominant_class,
                "maxConfidence": round(max_conf, 4),
                "counts": counts
            }
        except Exception as e:
            logger.error(f"Inference error in {self.MODEL_NAME}: {e}")
            return {
                "status": "ERROR",
                "model": self.MODEL_NAME,
                "error": str(e),
                "detections": [],
                "dominantClass": None,
                "maxConfidence": 0.0,
                "counts": {}
            }
