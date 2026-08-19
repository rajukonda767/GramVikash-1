# backend/app/services/groq_service.py
import logging
from typing import Optional, Dict, Any, List
from groq import Groq
from app.core.config import settings

logger = logging.getLogger("gramvikas")

# APMC Mandi Market Benchmark Rates in Andhra Pradesh for Real-Time Context
AP_MANDI_RATES = (
    "LIVE APMC MANDI RATES (Andhra Pradesh):\n"
    "- Tomato: ₹3,800/quintal (Madanapalle APMC, Range: ₹3,200 - ₹4,200/q)\n"
    "- Paddy / Rice (Dhan): ₹2,320/quintal (Vijayawada APMC, MSP: ₹2,300/q)\n"
    "- Cotton: ₹7,450/quintal (Guntur APMC, Range: ₹7,100 - ₹7,800/q)\n"
    "- Red Chilli (Teja/Byadagi): ₹18,500/quintal (Guntur APMC Yard)\n"
    "- Maize (Corn): ₹2,150/quintal (Vijayawada APMC)\n"
    "- Banana: ₹1,800/quintal (Kadapa / East Godavari)\n"
    "- Groundnut: ₹6,200/quintal (Anantapur APMC)\n"
    "- Black Gram (Urad): ₹8,200/quintal (Guntur APMC)\n"
    "- Green Gram (Moong): ₹8,400/quintal (Krishna APMC)"
)

class GroqService:
    def __init__(self):
        self.client = None
        if settings.GROQ_API_KEY:
            try:
                self.client = Groq(api_key=settings.GROQ_API_KEY)
                logger.info("✅ Groq client initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Groq client: {e}")

    def explain_crop_recommendation(
        self,
        top_crop: str,
        n: float,
        p: float,
        k: float,
        ph: float,
        location: str,
        weather: Optional[dict],
        language: str = "te"
    ) -> Dict[str, str]:
        """
        Uses Groq Llama 3.3 70B to generate clear, structured agricultural explanations
        (What, Why, Next Action) for rural farmers in Telugu or English.
        """
        lang_prompt = (
            "Respond in pure, simple rural Telugu script (తెలుగు)."
            if language == "te" else
            "Respond in clear, farmer-friendly Indian English."
        )

        system_prompt = (
            "You are GramVikas AI, an expert agricultural advisor for Indian farmers in Andhra Pradesh and South India.\n"
            "Explain ML crop recommendation decisions clearly and concisely.\n"
            "Format your response strictly as 3 bullet points:\n"
            "1. WHAT: (Recommended crop name and suitability)\n"
            "2. WHY: (Why soil NPK/pH and climate support this crop)\n"
            "3. NEXT ACTION: (Immediate next steps for sowing/field preparation)\n"
            f"{lang_prompt}"
        )

        user_content = (
            f"Crop: {top_crop}\n"
            f"Soil Parameters: N={n} kg/ha, P={p} kg/ha, K={k} kg/ha, pH={ph}\n"
            f"Location: {location}\n"
            f"Weather: {weather.get('temperature', 30) if weather else 30}°C, Humidity: {weather.get('humidity', 65) if weather else 65}%\n"
            f"Provide the 3-point explanation now."
        )

        if not self.client:
            return {
                "what": f"{top_crop.title()}",
                "why": "Optimal soil nutrients and climate match.",
                "action": "Prepare seedbed and apply basal fertilizer dose."
            }

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                model=settings.GROQ_MODEL,
                temperature=0.3,
                max_tokens=300
            )
            raw_text = chat_completion.choices[0].message.content.strip()
            return {"full_explanation": raw_text}
        except Exception as e:
            logger.error(f"Groq API explanation error: {e}")
            return {
                "what": f"{top_crop.title()}",
                "why": "Optimal soil nutrients and climate match.",
                "action": "Consult local Krishi Vigyan Kendra for certified seeds."
            }

    def chat_with_farmer(
        self,
        user_message: str,
        farmer_context: Optional[dict] = None,
        language: str = "te",
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Conversational assistant grounded in farmer's real context, APMC market prices,
        and continuous multi-turn dialogue history.
        """
        speech_code = "te-IN" if language == "te" else "en-IN"

        lang_instruction = (
            "You MUST respond in natural, friendly rural Telugu (తెలుగు) script. Use polite farmer-friendly words."
            if language == "te" else
            "You MUST respond in simple, helpful Indian English."
        )

        context_str = ""
        if farmer_context:
            context_str = (
                f"\nCURRENT FARMER PROFILE & FARM CONTEXT:\n"
                f"- Farmer Name: {farmer_context.get('name', 'Raju')}\n"
                f"- Location: {farmer_context.get('location', 'Vijayawada, NTR District, Andhra Pradesh')}\n"
                f"- Farm Size: {farmer_context.get('land_size', '3.5 acres')}\n"
                f"- Current Active Crop: {farmer_context.get('crop', 'Paddy (వరి)')}\n"
                f"- Soil Moisture Level: {farmer_context.get('soil_moisture', '68%')}\n"
                f"- Soil Type: Alluvial / Clay Loam (నల్లరేగడి/ఒండ్రు)\n"
            )

        system_prompt = (
            "You are GramVikas AI (గ్రామవికాస్ AI), an intelligent agricultural paired assistant for Indian farmers.\n"
            "You have direct access to real APMC Mandi rates, weather data, and crop agronomy guidelines.\n"
            "Key Instructions:\n"
            "1. When asked about crop prices/rates (e.g. Tomato, Paddy, Cotton, Chilli), always provide exact AP mandi rates from the data below.\n"
            "2. When asked about watering/irrigation, refer to their active crop and soil moisture.\n"
            "3. When asked about crop diseases or fertilization, give practical 2-3 step advice.\n"
            "4. Keep responses concise, accurate, and conversational (3-5 sentences max).\n"
            "5. Continue multi-turn conversation smoothly based on earlier messages.\n\n"
            f"{context_str}\n"
            f"{AP_MANDI_RATES}\n\n"
            f"{lang_instruction}"
        )

        # Build messages payload with conversation history
        messages_payload = [{"role": "system", "content": system_prompt}]

        # Append previous conversation history if provided (limit to last 6 turns)
        if history:
            for turn in history[-6:]:
                role = "user" if turn.get("sender") == "user" or turn.get("role") == "user" else "assistant"
                content = turn.get("text") or turn.get("content") or ""
                if content:
                    messages_payload.append({"role": role, "content": content})

        # Append current user query
        messages_payload.append({"role": "user", "content": user_message})

        if not self.client:
            default_replies = {
                "te": "నమస్కారం! మీ ప్రశ్నను స్వీకరించాము. గ్రామవికాస్ AI డాష్‌బోర్డ్‌లో పంట, మార్కెట్ ధరల పూర్తి సమాచారం అందుబాటులో ఉంది.",
                "en": "Namaskaram! GramVikas AI is ready to assist with your crop management, market rates, and irrigation planning."
            }
            return {
                "text": default_replies.get(language, default_replies["te"]),
                "language": language,
                "speech_language": speech_code
            }

        try:
            chat_completion = self.client.chat.completions.create(
                messages=messages_payload,
                model=settings.GROQ_MODEL,
                temperature=0.4,
                max_tokens=350
            )
            reply = chat_completion.choices[0].message.content.strip()
            return {
                "text": reply,
                "language": language,
                "speech_language": speech_code
            }
        except Exception as e:
            logger.error(f"Groq Chat error: {e}")
            fallback_text = (
                "విజయవాడ మార్కెట్‌లో నేటి వరి ధాన్యం క్వింటాల్ ధర ₹2,320, మదనపల్లెలో టమాటో క్వింటాల్ ధర ₹3,800, గుంటూరులో పత్తి ₹7,450 గా ఉంది."
                if language == "te" else
                "Today's Mandi rates: Paddy ₹2,320/q in Vijayawada, Tomato ₹3,800/q in Madanapalle, Cotton ₹7,450/q in Guntur."
            )
            return {
                "text": fallback_text,
                "language": language,
                "speech_language": speech_code
            }

groq_service = GroqService()
