import io
import math
from typing import Dict, Any, Tuple
from PIL import Image, ImageOps, ImageStat
import numpy as np

class ImagePreprocessor:
    @staticmethod
    def preprocess_image(image_bytes: bytes) -> Dict[str, Any]:
        """
        Validate MIME and magic bytes, apply EXIF orientation transposition,
        convert to standard RGB and Grayscale, compute quality metrics.
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

            # Convert to standard RGB and Grayscale
            rgb_img = img.convert("RGB")
            gray_img = img.convert("L")

            # Check image quality (brightness, contrast, sharpness)
            stat = ImageStat.Stat(gray_img)
            mean_brightness = stat.mean[0]
            rms_contrast = stat.rms[0]

            # Shannon entropy
            hist = gray_img.histogram()
            hist_sum = sum(hist)
            entropy = 0.0
            for count in hist:
                if count > 0:
                    p = count / hist_sum
                    entropy -= p * math.log2(p)

            # Quality classification
            quality = "GOOD"
            reasons = []
            if mean_brightness < 30:
                quality = "DARK"
                reasons.append("Image is severely underexposed")
            elif mean_brightness > 235:
                quality = "OVEREXPOSED"
                reasons.append("Image is overexposed")
            
            if entropy < 3.5:
                quality = "LOW_DETAIL"
                reasons.append("Low texture/feature content")

            return {
                "is_valid": True,
                "rgb_img": rgb_img,
                "gray_img": gray_img,
                "width": width,
                "height": height,
                "format": format_name,
                "quality": quality,
                "entropy": entropy,
                "mean_brightness": mean_brightness,
                "rms_contrast": rms_contrast,
                "quality_reasons": reasons
            }
        except Exception as e:
            return {
                "is_valid": False,
                "quality": "CORRUPTED",
                "reason": f"Image corrupted or invalid format: {str(e)}"
            }

