# backend/app/services/yield_service.py
import logging
from typing import Dict, Any, Optional
from app.ml.model_loader import model_manager
from app.core.database import get_supabase_admin

logger = logging.getLogger("gramvikas")

# ICAR & State Agricultural Universities Benchmark Yield Database (Tonnes / Acre)
CROP_YIELD_BENCHMARKS = {
    "Rice": {"base": 3.4, "name_te": "వరి", "name_hi": "धान", "opt_rain": 1000, "opt_fert": 120, "opt_pest": 2.5},
    "Paddy": {"base": 3.4, "name_te": "వరి", "name_hi": "धान", "opt_rain": 1000, "opt_fert": 120, "opt_pest": 2.5},
    "Maize": {"base": 3.8, "name_te": "మొక్కజొన్న", "name_hi": "मक्का", "opt_rain": 750, "opt_fert": 120, "opt_pest": 2.0},
    "Cotton": {"base": 1.6, "name_te": "పత్తి", "name_hi": "कपास", "opt_rain": 650, "opt_fert": 100, "opt_pest": 3.5},
    "Cotton(lint)": {"base": 1.6, "name_te": "పత్తి", "name_hi": "कपास", "opt_rain": 650, "opt_fert": 100, "opt_pest": 3.5},
    "Sugarcane": {"base": 35.0, "name_te": "చెరకు", "name_hi": "गन्ना", "opt_rain": 1500, "opt_fert": 250, "opt_pest": 3.0},
    "Groundnut": {"base": 1.2, "name_te": "వేరుశనగ", "name_hi": "मूंगफली", "opt_rain": 550, "opt_fert": 60, "opt_pest": 1.5},
    "Jowar": {"base": 1.1, "name_te": "జొన్న", "name_hi": "ज्वार", "opt_rain": 500, "opt_fert": 80, "opt_pest": 1.5},
    "Moong(Green Gram)": {"base": 0.75, "name_te": "పెసలు", "name_hi": "मूंग", "opt_rain": 450, "opt_fert": 40, "opt_pest": 1.0},
    "Urad": {"base": 0.8, "name_te": "మినుము", "name_hi": "उड़द", "opt_rain": 500, "opt_fert": 40, "opt_pest": 1.0},
    "Sunflower": {"base": 0.95, "name_te": "పొద్దుతిరుగుడు", "name_hi": "सूरजमुखी", "opt_rain": 500, "opt_fert": 60, "opt_pest": 1.5},
    "Castor seed": {"base": 0.85, "name_te": "ఆముదం", "name_hi": "अरंडी", "opt_rain": 450, "opt_fert": 50, "opt_pest": 1.0},
    "Wheat": {"base": 2.2, "name_te": "గోధుమ", "name_hi": "गेहूं", "opt_rain": 400, "opt_fert": 120, "opt_pest": 1.5},
    "Potato": {"base": 10.5, "name_te": "బంగాళాదుంప", "name_hi": "आलू", "opt_rain": 600, "opt_fert": 150, "opt_pest": 2.5},
    "Onion": {"base": 9.0, "name_te": "ఉల్లి", "name_hi": "प्याज", "opt_rain": 600, "opt_fert": 100, "opt_pest": 2.0},
    "Tomato": {"base": 12.0, "name_te": "టమాటో", "name_hi": "टमाटर", "opt_rain": 600, "opt_fert": 120, "opt_pest": 2.5},
    "Banana": {"base": 22.0, "name_te": "అరటి", "name_hi": "केला", "opt_rain": 1200, "opt_fert": 200, "opt_pest": 2.0},
    "Mango": {"base": 4.5, "name_te": "మామిడి", "name_hi": "आम", "opt_rain": 800, "opt_fert": 100, "opt_pest": 3.0},
}

class YieldService:
    @staticmethod
    def estimate_yield(
        crop: str = "Rice",
        area_acres: float = 3.5,
        season: str = "Kharif",
        state: str = "Andhra Pradesh",
        annual_rainfall: float = 850.0,
        fertilizer_kg: float = 120.0,
        pesticide_kg: float = 2.5,
        user_id: Optional[str] = None,
        farm_id: Optional[str] = None,
        crop_id: Optional[str] = None,
        language: str = "te"
    ) -> Dict[str, Any]:
        """
        Agronomic Yield Estimation Engine:
        Calculates realistic crop yield based on farm area, crop genetics, seasonal alignment,
        rainfall sufficiency, and nutrient management curves.
        """
        area = max(0.1, float(area_acres))
        rain = max(50.0, float(annual_rainfall))
        fert = max(0.0, float(fertilizer_kg))
        pest = max(0.0, float(pesticide_kg))

        # Find crop profile
        bm = CROP_YIELD_BENCHMARKS.get(crop)
        if not bm:
            # Try partial match
            for k, v in CROP_YIELD_BENCHMARKS.items():
                if crop.lower() in k.lower() or k.lower() in crop.lower():
                    bm = v
                    break
        if not bm:
            bm = {"base": 2.5, "name_te": crop, "name_hi": crop, "opt_rain": 800, "opt_fert": 100, "opt_pest": 2.0}

        base_yield = bm["base"]

        # 1. Rainfall response factor (optimal ratio, bounded ±18%)
        rain_ratio = rain / max(1.0, bm["opt_rain"])
        rain_factor = 1.0 + min(0.18, max(-0.25, (rain_ratio - 1.0) * 0.3))

        # 2. Fertilizer response factor (optimal ratio, bounded ±15%)
        fert_ratio = fert / max(1.0, bm["opt_fert"])
        fert_factor = 1.0 + min(0.15, max(-0.25, (fert_ratio - 1.0) * 0.25))

        # 3. Seasonal suitability factor
        s_lower = season.lower()
        if "kharif" in s_lower:
            s_factor = 1.05
        elif "rabi" in s_lower:
            s_factor = 1.00
        elif "summer" in s_lower or "వేసవి" in s_lower:
            s_factor = 0.92
        else:
            s_factor = 1.00

        # Calculate final yield metrics
        yield_per_acre = round(base_yield * rain_factor * fert_factor * s_factor, 2)
        total_yield = round(yield_per_acre * area, 2)

        crop_te = bm.get("name_te", crop)
        crop_hi = bm.get("name_hi", crop)

        # Spoken summary for TTS
        spoken_summary = {
            "te": f"{area} ఎకరాల {crop_te} పంటకు అంచనా మొత్తం దిగుబడి {total_yield} టన్నులు. ఎకరానికి {yield_per_acre} టన్నులు. సమతుల్య ఎరువుల నిర్వహణ మరియు సకాలంలో నీటిపారుదల వలన దిగుబడి పెరుగుతుంది.",
            "hi": f"{area} एकड़ {crop_hi} की कुल अनुमानित उपज {total_yield} टन है, यानी प्रति एकड़ {yield_per_acre} टन।",
            "en": f"Estimated total production for {area} acres of {crop} is {total_yield} tonnes ({yield_per_acre} tonnes per acre)."
        }

        factors = [
            {
                "name": {"en": "Fertilizer Nutrient Response", "te": "ఎరువుల పోషక స్పందన", "hi": "उर्वरक पोषक तत्व"},
                "impact": f"{'+' if fert_factor >= 1.0 else ''}{round((fert_factor - 1.0) * 100, 1)}%"
            },
            {
                "name": {"en": "Rainfall & Moisture Sufficiency", "te": "వర్షపాతం & తేమ లభ్యత", "hi": "वर्षा और नमी"},
                "impact": f"{'+' if rain_factor >= 1.0 else ''}{round((rain_factor - 1.0) * 100, 1)}%"
            },
            {
                "name": {"en": "Seasonal Climate Alignment", "te": "సీజన్ వాతావరణ అనుకూలత", "hi": "मौसमी अनुकूलता"},
                "impact": f"{'+' if s_factor >= 1.0 else ''}{round((s_factor - 1.0) * 100, 1)}%"
            }
        ]

        # Persist to Supabase if authenticated
        supabase = get_supabase_admin()
        if supabase and user_id:
            try:
                supabase.table("yield_predictions").insert({
                    "crop_id": crop_id,
                    "farm_id": farm_id,
                    "user_id": user_id,
                    "predicted_yield": total_yield,
                    "yield_per_acre": yield_per_acre,
                    "unit": "tonnes",
                    "prediction_context": {
                        "crop": crop, "area": area, "season": season,
                        "state": state, "rainfall": rain, "fertilizer": fert
                    }
                }).execute()
            except Exception as e:
                logger.error(f"Failed to persist yield prediction: {e}")

        return {
            "status": "success",
            "crop": crop,
            "area_acres": area,
            "predicted_total_yield_tonnes": total_yield,
            "yield_per_acre": yield_per_acre,
            "confidence_range": f"{round(total_yield * 0.92, 1)} - {round(total_yield * 1.08, 1)} tonnes",
            "factors": factors,
            "spoken_summary": spoken_summary,
            "language": language,
            "speech_language": "te-IN" if language == "te" else "hi-IN" if language == "hi" else "en-IN"
        }

yield_service = YieldService()
