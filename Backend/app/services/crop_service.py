# backend/app/services/crop_service.py
import logging
from typing import Dict, Any, List, Optional
from app.ml.model_loader import model_manager
from app.services.weather_service import weather_service
from app.services.groq_service import groq_service
from app.core.database import get_supabase_admin

logger = logging.getLogger("gramvikas")

# Crop naming translations & market economics
CROP_TRANSLATIONS = {
    "rice": {"en": "Paddy (Rice)", "te": "వరి ధాన్యం", "hi": "धान (चावल)", "growing_days": 130, "price_per_q": 2320, "base_yield": 3.4},
    "maize": {"en": "Maize (Corn)", "te": "మొక్కజొన్న", "hi": "मक्का", "growing_days": 105, "price_per_q": 2150, "base_yield": 3.8},
    "cotton": {"en": "Cotton", "te": "పత్తి", "hi": "कपास", "growing_days": 160, "price_per_q": 7450, "base_yield": 1.6},
    "blackgram": {"en": "Black Gram (Urad)", "te": "మినుములు", "hi": "उड़द दाल", "growing_days": 80, "price_per_q": 8200, "base_yield": 0.8},
    "chickpea": {"en": "Chickpea (Chana)", "te": "శనగలు", "hi": "चना", "growing_days": 100, "price_per_q": 5800, "base_yield": 1.1},
    "pigeonpeas": {"en": "Pigeon Peas (Red Gram / Toor)", "te": "కందులు", "hi": "अरहर दाल", "growing_days": 150, "price_per_q": 9400, "base_yield": 0.9},
    "mothbeans": {"en": "Moth Beans", "te": "బొబ్బర్లు", "hi": "मोठ दाल", "growing_days": 75, "price_per_q": 6500, "base_yield": 0.7},
    "mungbean": {"en": "Green Gram (Moong)", "te": "పెసలు", "hi": "मूंग दाल", "growing_days": 70, "price_per_q": 8400, "base_yield": 0.75},
    "lentil": {"en": "Lentil (Masoor)", "te": "ఎర్ర కందిపప్పు", "hi": "मसूर दाल", "growing_days": 110, "price_per_q": 6200, "base_yield": 0.85},
    "pomegranate": {"en": "Pomegranate", "te": "దానిమ్మ", "hi": "अनार", "growing_days": 365, "price_per_q": 12000, "base_yield": 6.0},
    "banana": {"en": "Banana", "te": "అరటి", "hi": "కేలా", "growing_days": 330, "price_per_q": 1800, "base_yield": 22.0},
    "mango": {"en": "Mango", "te": "మామిడి", "hi": "आम", "growing_days": 365, "price_per_q": 4500, "base_yield": 8.0},
    "grapes": {"en": "Grapes", "te": "ద్రాక్ష", "hi": "अंगूर", "growing_days": 150, "price_per_q": 6000, "base_yield": 10.0},
    "watermelon": {"en": "Watermelon", "te": "పుచ్చకాయ", "hi": "तरबूज", "growing_days": 90, "price_per_q": 1200, "base_yield": 18.0},
    "muskmelon": {"en": "Muskmelon", "te": "ఖర్బూజ", "hi": "खरबूजा", "growing_days": 85, "price_per_q": 1600, "base_yield": 14.0},
    "apple": {"en": "Apple", "te": "ఆపిల్", "hi": "सेब", "growing_days": 365, "price_per_q": 9000, "base_yield": 7.0},
    "orange": {"en": "Sweet Orange (Mosambi)", "te": "బత్తాయి / నారింజ", "hi": "संतरा / मौसंबी", "growing_days": 365, "price_per_q": 4200, "base_yield": 9.0},
    "papaya": {"en": "Papaya", "te": "బొప్పాయి", "hi": "पपीता", "growing_days": 270, "price_per_q": 2000, "base_yield": 25.0},
    "coconut": {"en": "Coconut", "te": "కొబ్బరి", "hi": "नारियल", "growing_days": 365, "price_per_q": 3000, "base_yield": 5.0},
    "jute": {"en": "Jute", "te": "జనపనార", "hi": "पटसन", "growing_days": 120, "price_per_q": 4800, "base_yield": 2.2},
    "coffee": {"en": "Coffee", "te": "కాఫీ", "hi": "कॉफी", "growing_days": 365, "price_per_q": 24000, "base_yield": 1.2},
    "kidneybeans": {"en": "Kidney Beans (Rajma)", "te": "రాజ్మా", "hi": "राजमा", "growing_days": 110, "price_per_q": 9000, "base_yield": 1.0},
}

# Non-plains crops that should not be recommended for Andhra Pradesh / Telangana plains farms
NON_PLAINS_CROPS = {"coffee", "apple"}

class CropRecommendationService:
    @staticmethod
    def infer_soil_from_farmer_answers(
        previous_crop: str,
        previous_yield_quality: str,
        soil_type: str,
        drainage: str
    ) -> Dict[str, Any]:
        """
        Agricultural Knowledge Inference Engine:
        Maps 4 practical farmer questions into realistic soil suitability bands (source = 'inferred').
        """
        base_n = 70.0
        base_p = 40.0
        base_k = 40.0
        base_ph = 6.5

        # 1. Soil Type Impact
        st = soil_type.lower()
        if "black" in st or "నల్లరేగడి" in st:
            base_n += 15.0
            base_k += 15.0
            base_ph = 7.4
        elif "red" in st or "ఎర్ర" in st:
            base_n -= 10.0
            base_p -= 5.0
            base_ph = 6.2
        elif "alluvial" in st or "ఒండ్రు" in st:
            base_n += 20.0
            base_p += 10.0
            base_k += 10.0
            base_ph = 6.8
        elif "sandy" in st or "ఇసుక" in st:
            base_n -= 25.0
            base_p -= 15.0
            base_k -= 15.0
            base_ph = 6.0

        # 2. Previous Crop Legacy
        pc = previous_crop.lower()
        if any(legume in pc for legume in ["pulse", "gram", "moong", "urad", "శనగ", "మినుము", "పెసర"]):
            base_n += 25.0
        elif any(heavy in pc for heavy in ["paddy", "rice", "sugarcane", "cotton", "వరి", "చెరకు"]):
            base_n -= 15.0
            base_p -= 10.0

        # 3. Previous Yield Performance
        yq = previous_yield_quality.lower()
        if "very good" in yq or "బాగుంది" in yq:
            base_n += 10.0
            base_p += 5.0
        elif "poor" in yq or "తక్కువ" in yq:
            base_n -= 15.0
            base_p -= 10.0

        return {
            "nitrogen": max(20.0, min(140.0, round(base_n, 1))),
            "phosphorus": max(15.0, min(90.0, round(base_p, 1))),
            "potassium": max(15.0, min(90.0, round(base_k, 1))),
            "ph": max(5.5, min(8.2, round(base_ph, 1))),
            "source": "inferred"
        }

    @staticmethod
    def calculate_agronomic_rainfall(n: float, p: float, k: float, ph: float) -> float:
        """
        Calculates dynamic agro-climatic rainfall index based on soil nutrient profile:
        - High N + balanced P/K (Delta wetland) -> 220 mm (Paddy / Jute)
        - High N + low K (Black soil tract) -> 80 mm (Cotton)
        - Balanced N (60-80) + low K -> 90 mm (Maize)
        - High K / P (Pulses / Legumes) -> 75 mm (Chickpea / Lentil)
        - High P + High K -> 110 mm (Banana)
        """
        if n >= 70 and p >= 35 and k >= 35 and 5.5 <= ph <= 7.2:
            return 220.0  # Paddy / Rice optimal rainfall
        elif n >= 90 and k <= 30:
            return 80.0   # Cotton optimal rainfall
        elif 60 <= n <= 85 and k <= 30:
            return 90.0   # Maize optimal rainfall
        elif k >= 60 or (n <= 50 and p >= 45):
            return 75.0   # Chickpea / Pulses optimal rainfall
        elif p >= 65 and k >= 45:
            return 110.0  # Banana optimal rainfall
        elif n >= 75 and p >= 35:
            return 180.0  # Jute optimal rainfall
        else:
            return 95.0   # Standard agricultural rainfall

    @staticmethod
    async def recommend_crops(
        n: Optional[float] = None,
        p: Optional[float] = None,
        k: Optional[float] = None,
        ph: Optional[float] = None,
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        rainfall: Optional[float] = None,
        latitude: float = 16.5062,
        longitude: float = 80.6480,
        location_name: str = "Vijayawada, Andhra Pradesh",
        farmer_questions: Optional[dict] = None,
        user_id: Optional[str] = None,
        farm_id: Optional[str] = None,
        language: str = "te"
    ) -> Dict[str, Any]:
        """
        Full Crop Recommendation Pipeline:
        1. Check input completeness or run Agricultural inference
        2. Retrieve live weather context
        3. Dynamically align rainfall & climate factors
        4. Execute ML model prediction
        5. Filter regional crops for Andhra Pradesh
        6. Generate Groq explanation
        """
        source = "farmer_input"

        # Check if farmer provided soil NPK or if we should use inferred questions
        if n is None or p is None or k is None or ph is None:
            if farmer_questions:
                inferred = CropRecommendationService.infer_soil_from_farmer_answers(
                    previous_crop=farmer_questions.get("previous_crop", "None"),
                    previous_yield_quality=farmer_questions.get("previous_yield_quality", "Average"),
                    soil_type=farmer_questions.get("soil_type", "Alluvial"),
                    drainage=farmer_questions.get("drainage", "Normally")
                )
                n = inferred["nitrogen"]
                p = inferred["phosphorus"]
                k = inferred["potassium"]
                ph = inferred["ph"]
                source = "inferred"
            else:
                return {
                    "status": "need_more_info",
                    "message": "I need a little more information about your soil before I can give you a reliable recommendation.",
                    "message_te": "మీ నేలకు సంబంధించి మరికొన్ని వివరాలు అవసరం.",
                    "message_hi": "सटीक सिफारिश के लिए आपकी मिट्टी के बारे में कुछ और जानकारी चाहिए।"
                }

        # Retrieve live weather context if not supplied
        live_weather = weather_service.get_current_weather(latitude, longitude)
        if temperature is None:
            temperature = float(live_weather.get("temperature", 28.0)) if live_weather else 28.0
        if humidity is None:
            humidity = float(live_weather.get("humidity", 65.0)) if live_weather else 65.0
        
        # Dynamic agro-climatic rainfall alignment based on soil profile
        if rainfall is None or rainfall == 140.0:
            rainfall = CropRecommendationService.calculate_agronomic_rainfall(
                float(n), float(p), float(k), float(ph)
            )

        # Execute ML model inference
        ml_result = model_manager.predict_crop(
            n=float(n),
            p=float(p),
            k=float(k),
            temp=float(temperature),
            humidity=float(humidity),
            ph=float(ph),
            rainfall=float(rainfall)
        )

        all_candidates = ml_result.get("candidates", [])
        
        # Filter out non-plains hill crops like coffee/apple unless in high-altitude zones
        is_hill_zone = "araku" in location_name.lower() or "hill" in location_name.lower()
        if not is_hill_zone:
            filtered_candidates = [
                c for c in all_candidates if c["crop"].lower() not in NON_PLAINS_CROPS
            ]
        else:
            filtered_candidates = all_candidates

        if not filtered_candidates:
            filtered_candidates = all_candidates

        top_candidates = filtered_candidates[:3]
        enriched_recommendations = []

        for rank, candidate in enumerate(top_candidates, start=1):
            crop_key = candidate["crop"].lower()
            meta = CROP_TRANSLATIONS.get(crop_key, {
                "en": crop_key.title(),
                "te": crop_key,
                "hi": crop_key,
                "growing_days": 120,
                "price_per_q": 3000,
                "base_yield": 2.5
            })

            expected_yield = round(meta["base_yield"] * (candidate["confidence"] / 100.0 + 0.1), 1)
            estimated_revenue = int(expected_yield * 10 * meta["price_per_q"])
            estimated_cost = int(24000)
            estimated_profit = estimated_revenue - estimated_cost

            enriched_recommendations.append({
                "rank": rank,
                "crop_key": crop_key,
                "name_en": meta["en"],
                "name_te": meta["te"],
                "name_hi": meta["hi"],
                "confidence": candidate["confidence"],
                "suitability_percent": candidate["confidence"],
                "expected_yield_tonnes_per_acre": expected_yield,
                "growing_days": meta["growing_days"],
                "estimated_profit_per_acre": estimated_profit,
                "market_price_per_quintal": meta["price_per_q"],
            })

        # Generate Groq explainability
        top_crop_name = enriched_recommendations[0]["name_en"]
        explanation = groq_service.explain_crop_recommendation(
            top_crop=top_crop_name,
            n=n, p=p, k=k, ph=ph,
            location=location_name,
            weather=live_weather,
            language=language
        )

        top_crop = enriched_recommendations[0]
        profit_formatted = f"{top_crop['estimated_profit_per_acre']:,}"
        spoken_summary = {
            "te": f"మీ నేల మరియు వాతావరణానికి అత్యంత అనుకూలమైన పంట {top_crop['name_te']}. అనుకూలత {top_crop['suitability_percent']} శాతం. ఆశించిన దిగుబడి ఎకరానికి {top_crop['expected_yield_tonnes_per_acre']} టన్నులు మరియు అంచనా లాభం ఎకరానికి {profit_formatted} రూపాయలు.",
            "hi": f"आपकी मिट्टी के लिए सबसे उपयुक्त फसल {top_crop['name_hi']} है। उपयुक्तता {top_crop['suitability_percent']}% है।",
            "en": f"Based on your soil and climate, the top recommended crop is {top_crop['name_en']} with {top_crop['suitability_percent']}% suitability."
        }

        # Persist to Supabase if authenticated
        supabase = get_supabase_admin()
        if supabase and user_id:
            try:
                supabase.table("crop_recommendations").insert({
                    "user_id": user_id,
                    "farm_id": farm_id,
                    "top_crop": top_crop["name_en"],
                    "suitability_score": top_crop["confidence"],
                    "soil_inputs": {"n": n, "p": p, "k": k, "ph": ph},
                    "weather_context": {"temperature": temperature, "humidity": humidity, "rainfall": rainfall},
                    "recommendations": enriched_recommendations,
                    "explanation": explanation
                }).execute()
            except Exception as e:
                logger.error(f"Failed to persist crop recommendation: {e}")

        return {
            "status": "success",
            "source": source,
            "soil_inputs": {"nitrogen": n, "phosphorus": p, "potassium": k, "ph": ph},
            "weather_context": {
                "temperature": temperature,
                "humidity": humidity,
                "rainfall": rainfall,
                "location": location_name
            },
            "recommendations": enriched_recommendations,
            "explanation": explanation,
            "spoken_summary": spoken_summary,
            "language": language,
            "speech_language": "te-IN" if language == "te" else "hi-IN" if language == "hi" else "en-IN"
        }

crop_recommendation_service = CropRecommendationService()
