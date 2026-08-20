# backend/app/ml/image_validator.py
import io
import numpy as np
from PIL import Image
from typing import Tuple, Dict, Any

class ImageValidator:
    """
    Production-grade validation pipeline for crop leaf images:
    1. File format and dimension verification
    2. Image blur / sharpness verification
    3. Human face / skin / selfie detector (rejects selfies immediately)
    4. Chlorophyll & plant foliage vegetation analysis
    Rejects selfies, vehicles, animals, documents, or random non-plant objects.
    """

    ALLOWED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP"}
    MIN_DIMENSION = 100
    MAX_DIMENSION = 5000

    @staticmethod
    def validate_image_bytes(image_bytes: bytes, expected_crop: str = None) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates whether the raw bytes represent a valid, sharp, plant/leaf image.
        Returns: (is_valid, error_reason_key, debug_metrics)
        """
        if not image_bytes or len(image_bytes) < 1024:
            return False, "file_too_small", {"size": len(image_bytes)}

        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.verify()
            image = Image.open(io.BytesIO(image_bytes))
        except Exception:
            return False, "corrupt_image", {}

        fmt = (image.format or "").upper()
        if fmt not in ImageValidator.ALLOWED_FORMATS:
            return False, "invalid_format", {"format": fmt}

        width, height = image.size
        if width < ImageValidator.MIN_DIMENSION or height < ImageValidator.MIN_DIMENSION:
            return False, "resolution_too_low", {"width": width, "height": height}

        # Convert to RGB numpy array for image analysis
        rgb_image = image.convert("RGB")
        img_arr = np.array(rgb_image, dtype=np.float32)
        total_pixels = float(width * height)

        r = img_arr[:, :, 0]
        g = img_arr[:, :, 1]
        b = img_arr[:, :, 2]

        # 1. Human Face / Skin / Selfie Detection
        # Standard YCbCr / RGB skin tone color range: R > 95, G > 40, B > 20, R > G > B, (R - G) > 15
        skin_pixels = np.sum((r > 95) & (g > 40) & (b > 20) & (r > g) & (g > b) & ((r - g) > 12) & ((r - b) > 20))
        skin_ratio = float(skin_pixels) / total_pixels

        if skin_ratio > 0.08:  # More than 8% human skin pixels -> Selfie or person photo
            return False, "selfie_detected", {
                "skin_ratio": round(skin_ratio, 3),
                "message": "Human selfie detected instead of plant leaf."
            }

        # 2. Blur / Sharpness check using Laplacian variance approximation
        gray = 0.2989 * r + 0.5870 * g + 0.1140 * b
        laplacian = (
            np.roll(gray, 1, axis=0) + np.roll(gray, -1, axis=0) +
            np.roll(gray, 1, axis=1) + np.roll(gray, -1, axis=1) - 4 * gray
        )
        variance = float(np.var(laplacian[1:-1, 1:-1]))
        if variance < 2.0:
            return False, "blurry_image", {"variance": variance}

        # 3. Chlorophyll & Plant Foliage Vegetation Analysis
        # Excess Green Index (ExG = 2G - R - B)
        green_leaf_pixels = np.sum((2.0 * g - r - b) > 12.0)
        
        # Chlorosis / yellow leaf / diseased brown foliage (G >= 60, R >= 60, B <= G, G >= B + 10)
        diseased_leaf_pixels = np.sum((g >= 60) & (r >= 60) & (b <= g) & (g >= b + 10))
        
        plant_pixel_ratio = (green_leaf_pixels + diseased_leaf_pixels) / total_pixels

        # Non-plant images (e.g. wall, car, clothes, room) have plant_pixel_ratio < 0.15
        if plant_pixel_ratio < 0.15:
            return False, "not_a_plant", {
                "plant_ratio": round(plant_pixel_ratio, 3),
                "green_pixels": int(green_leaf_pixels),
                "diseased_pixels": int(diseased_leaf_pixels)
            }

        return True, "valid", {
            "width": width,
            "height": height,
            "variance": round(variance, 1),
            "plant_ratio": round(plant_pixel_ratio, 3),
            "skin_ratio": round(skin_ratio, 3)
        }
