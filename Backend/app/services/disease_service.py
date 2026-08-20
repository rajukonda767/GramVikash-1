# backend/app/services/disease_service.py
import io
import logging
import numpy as np
from PIL import Image
from typing import Dict, Any, Optional
from app.ml.image_validator import ImageValidator
from app.ml.model_loader import model_manager
from app.utils.disease_names import get_disease_info, DISEASE_CLASS_NAMES
from app.core.database import get_supabase_admin

logger = logging.getLogger("gramvikas")

class DiseaseDetectionService:
    @staticmethod
    def preprocess_image(image_bytes: bytes) -> np.ndarray:
        """Resizes and normalizes image for Keras MobileNetV2 (1, 224, 224, 3)."""
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize((224, 224), Image.Resampling.BILINEAR)
        arr = np.array(image, dtype=np.float32) / 255.0  # Normalize to [0, 1]
        return np.expand_dims(arr, axis=0)

    @staticmethod
    async def diagnose_leaf(
        image_bytes: bytes,
        filename: str = "leaf.jpg",
        user_id: Optional[str] = None,
        farm_id: Optional[str] = None,
        crop_id: Optional[str] = None,
        language: str = "te"
    ) -> Dict[str, Any]:
        """
        Disease Detection Pipeline:
        1. Multi-stage image validation (format, sharpness, foliage presence)
        2. Keras model inference on (1, 224, 224, 3)
        3. 20-class metadata & treatment lookup
        4. Natural multi-step speech synthesis (without robotic step 1, step 2 numbers)
        5. Upload to Supabase Storage & save record
        """
        # 1. Validation Layer
        is_valid, reason, debug_metrics = ImageValidator.validate_image_bytes(image_bytes)
        if not is_valid:
            error_messages = {
                "selfie_detected": {
                    "en": "Human selfie or person detected. Please upload or capture a clear photo of a plant leaf.",
                    "te": "సెల్ఫీ లేదా వ్యక్తి ఫోటో గుర్తించబడింది. దయచేసి పంట ఆకు యొక్క స్పష్టమైన ఫోటోను తీయండి లేదా అప్‌లోడ్ చేయండి."
                },
                "not_a_plant": {
                    "en": "Not recognized as a plant leaf. Please upload a clear close-up photo of the crop leaf.",
                    "te": "ఇది పంట ఆకు కాదు. దయచేసి పంట ఆకుకు సంబంధించిన స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి."
                },
                "blurry_image": {
                    "en": "The uploaded photo is too blurry. Please take a sharper picture in daylight.",
                    "te": "ఫోటో అస్పష్టంగా ఉంది. దయచేసి సహజ కాంతిలో స్పష్టమైన ఫోటో తీయండి."
                },
                "invalid_format": {
                    "en": "Unsupported image format. Please upload JPG, PNG, or WEBP.",
                    "te": "చెల్లని ఫార్మాట్. దయచేసి JPG లేదా PNG ఫోటోను ఎంచుకోండి."
                }
            }
            err_dict = error_messages.get(reason, error_messages["not_a_plant"])
            return {
                "status": "invalid_image",
                "reason_code": reason,
                "message": err_dict["en"],
                "message_te": err_dict["te"],
                "debug": debug_metrics
            }

        # 2. Model Preprocessing & Inference
        input_tensor = DiseaseDetectionService.preprocess_image(image_bytes)
        pred_result = model_manager.predict_disease(input_tensor)

        class_idx = pred_result["class_index"]
        confidence = pred_result["confidence"]

        # Reject if model confidence is below 60% (random non-leaf photo)
        if confidence < 60.0:
            return {
                "status": "invalid_image",
                "reason_code": "low_confidence",
                "message": "Could not identify crop leaf clearly. Please capture a close-up photo of the leaf.",
                "message_te": "పంట ఆకు స్పష్టంగా గుర్తించబడలేదు. దయచేసి ఆకును కెమెరాకు దగ్గరగా ఉంచి స్పష్టమైన ఫోటో తీయండి.",
                "debug": {"confidence": confidence}
            }

        disease_key = DISEASE_CLASS_NAMES[class_idx]
        info = get_disease_info(disease_key)

        # 3. Confidence Warning if < 40%
        is_low_confidence = confidence < 40.0

        # 4. Natural Spoken Summary for Audio Readout (fluent native sentences without "step 1, step 2")
        disease_display_name = info["name"].get(language, info["name"]["en"])
        disease_display_name_te = info["name"].get("te", info["name"]["en"])
        disease_display_name_en = info["name"].get("en", disease_key)

        if info["is_healthy"]:
            spoken_summary = {
                "te": "శుభవార్త! మీ పంట పూర్తిగా ఆరోగ్యంగా ఉంది. ఆకుపై ఎటువంటి వ్యాధి లేదా తెగులు లక్షణాలు కనిపించలేదు.",
                "en": "Good news! Your crop is completely healthy. No disease or pest symptoms were detected on this leaf."
            }
        else:
            treatments = info.get("treatments", [])
            treatments_te = [t.get("te", t.get("en", "")) for t in treatments]
            treatments_en = [t.get("en", "") for t in treatments]

            # Build natural Telugu narrative
            remedies_te = ""
            if len(treatments_te) >= 1:
                remedies_te += f"మొదటిగా, {treatments_te[0]}. "
            if len(treatments_te) >= 2:
                remedies_te += f"ఆ తర్వాత, {treatments_te[1]}. "
            if len(treatments_te) >= 3:
                remedies_te += f"మరియు {treatments_te[2]}."

            # Build natural English narrative
            remedies_en = ""
            if len(treatments_en) >= 1:
                remedies_en += f"First, {treatments_en[0]}. "
            if len(treatments_en) >= 2:
                remedies_en += f"Next, {treatments_en[1]}. "
            if len(treatments_en) >= 3:
                remedies_en += f"Also, {treatments_en[2]}."

            spoken_summary = {
                "te": f"మీ పంటలో {disease_display_name_te} గుర్తించబడింది. నమ్మకం {int(confidence)} శాతం. నివారణ చర్యలు: {remedies_te}",
                "en": f"{disease_display_name_en} was detected with {int(confidence)} percent confidence. Recommended treatments: {remedies_en}"
            }

        # 5. Save to Supabase Storage & Database if configured
        image_path = None
        supabase = get_supabase_admin()
        if supabase and user_id:
            try:
                storage_filename = f"{user_id}/{int(np.random.randint(1000, 9999))}_{filename}"
                supabase.storage.from_("disease-leaves").upload(
                    storage_filename,
                    image_bytes,
                    {"content-type": "image/jpeg"}
                )
                image_path = storage_filename

                supabase.table("disease_scans").insert({
                    "user_id": user_id,
                    "farm_id": farm_id,
                    "crop_id": crop_id,
                    "image_path": image_path,
                    "detected_disease": info["name"]["en"],
                    "disease_key": disease_key,
                    "confidence": confidence,
                    "severity": info["severity"],
                    "explanation": info["symptoms"]["en"],
                    "treatment_advice": info["treatments"]
                }).execute()

                supabase.table("farm_activities").insert({
                    "user_id": user_id,
                    "farm_id": farm_id,
                    "activity_type": "disease_scan",
                    "description": f"Scanned leaf: {info['name']['en']} ({confidence}%)"
                }).execute()
            except Exception as e:
                logger.warning(f"Supabase disease scan storage/logging: {e}")

        return {
            "status": "success",
            "disease_key": disease_key,
            "crop": info["crop"],
            "disease_name": info["name"],
            "confidence": confidence,
            "severity": info["severity"],
            "is_healthy": info["is_healthy"],
            "is_low_confidence": is_low_confidence,
            "symptoms": info["symptoms"],
            "treatments": info["treatments"],
            "spoken_summary": spoken_summary,
            "language": language,
            "speech_language": "te-IN" if language == "te" else "en-IN"
        }

disease_service = DiseaseDetectionService()
