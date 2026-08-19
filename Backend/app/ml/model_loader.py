# backend/app/ml/model_loader.py
import os
import joblib
import logging
import numpy as np
from typing import Dict, Any, Optional

logger = logging.getLogger("gramvikas")

class ModelManager:
    """
    Singleton ML Model Loader:
    Loads all trained model artifacts into memory once at application startup.
    Provides thread-safe prediction methods for Crop, Disease, Yield, and Fertilizer.
    """

    def __init__(self):
        self.crop_model = None
        self.crop_scaler = None
        self.crop_encoder = None

        self.disease_model = None

        self.yield_model = None
        self.yield_scaler = None
        self.yield_crop_encoder = None
        self.yield_season_encoder = None
        self.yield_state_encoder = None

        self.fertilizer_model = None
        self.fertilizer_scaler = None
        self.fertilizer_crop_encoder = None
        self.fertilizer_soil_encoder = None
        self.fertilizer_label_encoder = None

        self.models_loaded = False
        self.load_errors: Dict[str, str] = {}

    def load_all_models(self, models_dir: str):
        """Loads all model artifacts from the specified models directory."""
        logger.info(f"Loading ML models from: {models_dir}")
        self.models_loaded = False
        self.load_errors = {}

        # 1. CROP RECOMMENDATION MODEL
        try:
            crop_dir = os.path.join(models_dir, "Crop_recommendation_model")
            self.crop_model = joblib.load(os.path.join(crop_dir, "crop_recommendation_model.pkl"))
            self.crop_scaler = joblib.load(os.path.join(crop_dir, "crop_scaler.pkl"))
            self.crop_encoder = joblib.load(os.path.join(crop_dir, "crop_label_encoder.pkl"))
            logger.info("✅ Crop Recommendation Model loaded successfully")
        except Exception as e:
            self.load_errors["crop_model"] = str(e)
            logger.error(f"❌ Failed to load Crop model: {e}")

        # 2. PLANT DISEASE DETECTION MODEL (Keras MobileNetV2)
        try:
            import tensorflow as tf
            disease_path = os.path.join(models_dir, "Plant_disease_model", "plant_disease_model.keras")
            self.disease_model = tf.keras.models.load_model(disease_path)
            logger.info("✅ Plant Disease Keras Model loaded successfully")
        except Exception as e:
            self.load_errors["disease_model"] = str(e)
            logger.error(f"❌ Failed to load Disease model: {e}")

        # 3. YIELD PREDICTION MODEL
        try:
            yield_dir = os.path.join(models_dir, "Yield_model")
            self.yield_model = joblib.load(os.path.join(yield_dir, "yield_prediction_model.pkl"))
            self.yield_scaler = joblib.load(os.path.join(yield_dir, "yield_scaler.pkl"))
            self.yield_crop_encoder = joblib.load(os.path.join(yield_dir, "yield_crop_encoder.pkl"))
            self.yield_season_encoder = joblib.load(os.path.join(yield_dir, "yield_season_encoder.pkl"))
            self.yield_state_encoder = joblib.load(os.path.join(yield_dir, "yield_state_encoder.pkl"))
            logger.info("✅ Yield Prediction Model loaded successfully")
        except Exception as e:
            self.load_errors["yield_model"] = str(e)
            logger.error(f"❌ Failed to load Yield model: {e}")

        # 4. FERTILIZER RECOMMENDATION MODEL
        try:
            fert_dir = os.path.join(models_dir, "Fertilizer_model")
            self.fertilizer_model = joblib.load(os.path.join(fert_dir, "fertilizer_model.pkl"))
            self.fertilizer_scaler = joblib.load(os.path.join(fert_dir, "fertilizer_scaler.pkl"))
            self.fertilizer_crop_encoder = joblib.load(os.path.join(fert_dir, "fertilizer_crop_encoder.pkl"))
            self.fertilizer_soil_encoder = joblib.load(os.path.join(fert_dir, "fertilizer_soil_encoder.pkl"))
            self.fertilizer_label_encoder = joblib.load(os.path.join(fert_dir, "fertilizer_label_encoder.pkl"))
            logger.info("✅ Fertilizer Recommendation Model loaded successfully")
        except Exception as e:
            self.load_errors["fertilizer_model"] = str(e)
            logger.error(f"❌ Failed to load Fertilizer model: {e}")

        self.models_loaded = len(self.load_errors) == 0
        return self.models_loaded

    def predict_crop(self, n: float, p: float, k: float, temp: float, humidity: float, ph: float, rainfall: float) -> Dict[str, Any]:
        """Predicts top crop recommendations with class probabilities using the loaded model."""
        if not self.crop_model or not self.crop_scaler or not self.crop_encoder:
            raise RuntimeError("Crop Recommendation model is not loaded.")

        features = np.array([[n, p, k, temp, humidity, ph, rainfall]])
        scaled_features = self.crop_scaler.transform(features)

        # Get probabilities for all classes
        probs = self.crop_model.predict_proba(scaled_features)[0]
        class_names = self.crop_encoder.classes_

        # Rank all crops descending by probability
        ranked_indices = np.argsort(probs)[::-1]

        top_candidates = []
        for idx in ranked_indices[:5]:
            crop_name = class_names[idx]
            prob = float(probs[idx])
            top_candidates.append({
                "crop": crop_name,
                "confidence": round(prob * 100, 1),
                "probability": prob
            })

        return {
            "top_crop": top_candidates[0]["crop"],
            "candidates": top_candidates
        }

    def predict_disease(self, image_array: np.ndarray) -> Dict[str, Any]:
        """Inference on preprocessed image array shape (1, 224, 224, 3)."""
        if not self.disease_model:
            raise RuntimeError("Plant Disease model is not loaded.")

        # Inference
        predictions = self.disease_model.predict(image_array, verbose=0)[0]
        predicted_class_idx = int(np.argmax(predictions))
        confidence = float(predictions[predicted_class_idx])

        return {
            "class_index": predicted_class_idx,
            "confidence": round(confidence * 100, 1),
            "raw_probabilities": predictions.tolist()
        }

    def predict_yield(self, crop: str, season: str, state: str, area: float, annual_rainfall: float, fertilizer_kg: float, pesticide_kg: float) -> float:
        """Inference on yield prediction model."""
        if not self.yield_model or not self.yield_scaler:
            raise RuntimeError("Yield Prediction model is not loaded.")

        # Encode categorical variables safely with fallbacks
        try:
            crop_code = int(self.yield_crop_encoder.transform([crop])[0])
        except Exception:
            # Fallback to closest matching crop or first crop
            matches = [c for c in self.yield_crop_encoder.classes_ if crop.lower() in c.lower()]
            crop_code = int(self.yield_crop_encoder.transform([matches[0] if matches else self.yield_crop_encoder.classes_[0]])[0])

        try:
            # Match season with padding if needed
            matched_seasons = [s for s in self.yield_season_encoder.classes_ if season.strip().lower() in s.strip().lower()]
            season_code = int(self.yield_season_encoder.transform([matched_seasons[0] if matched_seasons else self.yield_season_encoder.classes_[0]])[0])
        except Exception:
            season_code = 0

        try:
            state_code = int(self.yield_state_encoder.transform([state])[0])
        except Exception:
            matched_states = [s for s in self.yield_state_encoder.classes_ if 'andhra' in s.lower()]
            state_code = int(self.yield_state_encoder.transform([matched_states[0] if matched_states else self.yield_state_encoder.classes_[0]])[0])

        features = np.array([[crop_code, season_code, state_code, area, annual_rainfall, fertilizer_kg, pesticide_kg]])
        scaled_features = self.yield_scaler.transform(features)

        pred_yield = float(self.yield_model.predict(scaled_features)[0])
        return max(0.1, round(pred_yield, 2))

# Global Singleton instance
model_manager = ModelManager()
