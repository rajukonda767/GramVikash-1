# backend/app/services/irrigation_service.py
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.services.weather_service import weather_service
from app.core.database import get_supabase_admin

logger = logging.getLogger("gramvikas")

class IrrigationService:
    @staticmethod
    def calculate_plan(
        crop: str = "Paddy",
        growth_stage: str = "Vegetative Stage",
        soil_moisture: float = 45.0,
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        latitude: float = 16.5062,
        longitude: float = 80.6480,
        user_id: Optional[str] = None,
        farm_id: Optional[str] = None,
        crop_id: Optional[str] = None,
        language: str = "te"
    ) -> Dict[str, Any]:
        """Calculates smart irrigation requirement based on crop water requirements and real weather."""
        live_weather = weather_service.get_current_weather(latitude, longitude)
        temp = temperature if temperature is not None else (live_weather.get("temperature", 30.0) if live_weather else 30.0)
        humid = humidity if humidity is not None else (live_weather.get("humidity", 65.0) if live_weather else 65.0)

        is_rice = "rice" in crop.lower() or "paddy" in crop.lower() or "వరి" in crop
        optimal_min = 70.0 if is_rice else 50.0

        urgency = "low"
        water_amount = 0
        days_offset = 3

        if soil_moisture < optimal_min * 0.6:
            urgency = "critical"
            days_offset = 0
            water_amount = 28 if is_rice else 18
            timing_en = "Irrigate Immediately Today"
            timing_te = "ఈరోజే తక్షణమే నీరు అందించండి"
            timing_hi = "आज तुरंत सिंचाई करें"
        elif soil_moisture < optimal_min:
            urgency = "high"
            days_offset = 1
            water_amount = 22 if is_rice else 14
            timing_en = "Irrigate Tomorrow Morning (6 AM - 8 AM)"
            timing_te = "రేపు ఉదయం 6 నుండి 8 గంటల మధ్య నీరు పెట్టండి"
            timing_hi = "कल सुबह 6 से 8 बजे के बीच सिंचाई करें"
        else:
            urgency = "low"
            days_offset = 3
            timing_en = "No irrigation needed today (Moisture adequate)"
            timing_te = "ఈరోజు నీరు పెట్టాల్సిన అవసరం లేదు (తేమ సమృద్ధిగా ఉంది)"
            timing_hi = "आज सिंचाई की आवश्यकता नहीं है"

        recommended_date = (datetime.now() + timedelta(days=days_offset)).strftime("%Y-%m-%d")

        spoken_advice = {
            "te": f"మీ పంటలో నేల తేమ {soil_moisture}% గా ఉంది. {timing_te}. సిఫార్సు చేసిన నీటి పరిమాణం చదరపు మీటరుకు {water_amount} లీటర్లు.",
            "hi": f"मिट्टी की नमी {soil_moisture}% है। {timing_hi}।",
            "en": f"Soil moisture is at {soil_moisture}%. {timing_en}. Recommended dosage: {water_amount} L/m²."
        }

        reasons = [
            {"en": f"Current soil moisture ({soil_moisture}%) vs optimal threshold ({optimal_min}%).", "te": f"ప్రస్తుత నేల తేమ ({soil_moisture}%), ఆదర్శ తేమ పరిమితి ({optimal_min}%).", "hi": f"वर्तमान मिट्टी नमी ({soil_moisture}%)।"},
            {"en": f"Daytime temperature ({temp}°C) increases crop evapotranspiration.", "te": f"పగటి ఉష్ణోగ్రత ({temp}°C) వలన తేమ ఆవిరవుతుంది.", "hi": f"तापमान ({temp}°C) से वाष्पीकरण बढ़ता है।"}
        ]

        # Save recommendation in Supabase
        supabase = get_supabase_admin()
        if supabase and crop_id:
            try:
                supabase.table("irrigation_recommendations").insert({
                    "crop_id": crop_id,
                    "recommended_date": recommended_date,
                    "timing": timing_en,
                    "water_need_liters": water_amount,
                    "urgency": urgency,
                    "reason": timing_en,
                    "weather_context": live_weather,
                    "status": "pending"
                }).execute()
            except Exception as e:
                logger.error(f"Failed to record irrigation recommendation: {e}")

        return {
            "status": "success",
            "crop": crop,
            "soil_moisture_percent": soil_moisture,
            "urgency": urgency,
            "recommended_date": recommended_date,
            "timing": {"en": timing_en, "te": timing_te, "hi": timing_hi},
            "water_amount_liters_sqm": water_amount,
            "reasons": reasons,
            "spoken_advice": spoken_advice,
            "language": language,
            "speech_language": "te-IN" if language == "te" else "hi-IN" if language == "hi" else "en-IN"
        }

    @staticmethod
    def log_completed_irrigation(crop_id: str, farm_id: str, user_id: str, amount_liters: float, method: str = "Drip") -> Dict[str, Any]:
        """Logs a completed watering event and updates farm activities."""
        supabase = get_supabase_admin()
        if not supabase:
            return {"status": "error", "message": "Database unavailable"}

        try:
            today = datetime.now().strftime("%Y-%m-%d")
            supabase.table("irrigation_records").insert({
                "crop_id": crop_id,
                "farm_id": farm_id,
                "irrigation_date": today,
                "amount_liters": amount_liters,
                "method": method
            }).execute()

            supabase.table("farm_activities").insert({
                "user_id": user_id,
                "farm_id": farm_id,
                "crop_id": crop_id,
                "activity_type": "irrigation",
                "description": f"Irrigation completed ({method}, {amount_liters}L)",
                "activity_date": today
            }).execute()

            return {"status": "success", "message": "Irrigation recorded successfully"}
        except Exception as e:
            logger.error(f"Error logging irrigation: {e}")
            return {"status": "error", "message": str(e)}

irrigation_service = IrrigationService()
