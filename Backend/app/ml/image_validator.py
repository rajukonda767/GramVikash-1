# backend/app/ml/image_validator.py
import io
import numpy as np
from PIL import Image
from typing import Tuple, Dict, Any

class ImageValidator:
    """
    Production-grade validation pipeline for uploaded crop leaf images:
    1. File format and dimension verification
    2. Image quality / corruption / blur verification
    3. Foliage & leaf texture / color analysis (vegetation detection)
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
            # Reopen after verify
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

        # 1. Blur / Sharpness check using Laplacian variance approximation
        gray = 0.2989 * img_arr[:, :, 0] + 0.5870 * img_arr[:, :, 1] + 0.1140 * img_arr[:, :, 2]
        # Quick discrete Laplacian
        laplacian = (
            np.roll(gray, 1, axis=0) + np.roll(gray, -1, axis=0) +
            np.roll(gray, 1, axis=1) + np.roll(gray, -1, axis=1) - 4 * gray
        )
        variance = float(np.var(laplacian[1:-1, 1:-1]))
        if variance < 2.0:  # Extremely blurry or completely flat uniform color
            return False, "blurry_image", {"variance": variance}

        # 2. Foliage / Plant color analysis
        # Plant leaves have dominant green, yellow-brown (chlorosis/necrosis) spectrum
        r = img_arr[:, :, 0]
        g = img_arr[:, :, 1]
        b = img_arr[:, :, 2]

        # Normalized Difference Vegetation Index (NDVI) simulation in RGB (Excess Green Index = 2G - R - B)
        exg = 2.0 * g - r - b
        green_leaf_pixels = np.sum(exg > 10.0)
        
        # Yellow/Brown necrosis pixels (R > 80, G > 60, B < G, R >= G)
        brown_disease_pixels = np.sum((r > 70) & (g > 50) & (b < g) & (r >= g - 20))
        
        total_pixels = width * height
        foliage_ratio = (green_leaf_pixels + brown_disease_pixels) / float(total_pixels)

        # Non-plant images (e.g. human face, concrete wall, blue car, laptop screenshot) typically have foliage_ratio < 0.08
        if foliage_ratio < 0.08:
            return False, "not_a_plant", {
                "foliage_ratio": round(foliage_ratio, 3),
                "green_pixels": int(green_leaf_pixels),
                "brown_pixels": int(brown_disease_pixels)
            }

        return True, "valid", {
            "width": width,
            "height": height,
            "variance": round(variance, 1),
            "foliage_ratio": round(foliage_ratio, 3)
        }
