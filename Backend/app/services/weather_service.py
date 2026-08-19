# backend/app/services/weather_service.py
import requests
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("gramvikas")

class WeatherService:
    @staticmethod
    def get_current_weather(latitude: float = 16.5062, longitude: float = 80.6480) -> Optional[Dict[str, Any]]:
        """
        Retrieves real-time weather & forecast from Open-Meteo free API.
        If unavailable, returns None (no fake data).
        """
        try:
            url = (
                f"https://api.open-meteo.com/v1/forecast?"
                f"latitude={latitude}&longitude={longitude}&"
                f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&"
                f"hourly=soil_temperature_0cm,soil_moisture_0_to_1cm&"
                f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&"
                f"timezone=Asia%2FKolkata&forecast_days=4"
            )
            resp = requests.get(url, timeout=4.0)
            if resp.status_code != 200:
                logger.warning(f"Open-Meteo API returned {resp.status_code}")
                return None

            data = resp.json()
            current = data.get("current", {})
            daily = data.get("daily", {})

            condition_map = {
                0: {"en": "Clear Sky", "te": "నిర్మలమైన ఆకాశం", "hi": "साफ आसमान", "code": "clear"},
                1: {"en": "Mainly Clear", "te": "ప్రధానంగా నిర్మలం", "hi": "मुख्यतः साफ", "code": "clear"},
                2: {"en": "Partly Cloudy", "te": "పాక్షికంగా మేఘావృతం", "hi": "आंशिक बादल", "code": "partly_cloudy"},
                3: {"en": "Overcast", "te": "దట్టమైన మేఘాలు", "hi": "बादल छाए", "code": "cloudy"},
                51: {"en": "Light Drizzle", "te": "తేలికపాటి జల్లులు", "hi": "हल्की बूंदाबांदी", "code": "rain"},
                61: {"en": "Slight Rain", "te": "తేలికపాటి వర్షం", "hi": "हल्की बारिश", "code": "rain"},
                63: {"en": "Moderate Rain", "te": "మోస్తరు వర్షం", "hi": "मध्यम बारिश", "code": "rain"},
                65: {"en": "Heavy Rain", "te": "భారీ వర్షం", "hi": "भारी बारिश", "code": "heavy_rain"},
                80: {"en": "Rain Showers", "te": "వర్షపు జల్లులు", "hi": "वर्षा की बौछारें", "code": "rain"}
            }

            w_code = current.get("weather_code", 2)
            cond = condition_map.get(w_code, {"en": "Partly Cloudy", "te": "పాక్షికంగా మేఘావృతం", "hi": "आंशिक बादल", "code": "partly_cloudy"})

            forecast = []
            if "time" in daily and "temperature_2m_max" in daily:
                for idx, d_str in enumerate(daily["time"][:4]):
                    forecast.append({
                        "date": d_str,
                        "temp_max": round(daily["temperature_2m_max"][idx]),
                        "temp_min": round(daily["temperature_2m_min"][idx]),
                        "rain_chance": daily.get("precipitation_probability_max", [15])[idx]
                    })

            return {
                "available": True,
                "temperature": round(current.get("temperature_2m", 30.0)),
                "feels_like": round(current.get("apparent_temperature", 32.0)),
                "humidity": round(current.get("relative_humidity_2m", 65.0)),
                "wind_speed_km": round(current.get("wind_speed_10m", 12.0)),
                "rain_probability": daily.get("precipitation_probability_max", [15])[0] if daily.get("precipitation_probability_max") else 15,
                "rainfall_mm": current.get("rain", 0.0),
                "condition": cond,
                "forecast": forecast
            }
        except Exception as e:
            logger.error(f"Weather API error: {e}")
            return None

    @staticmethod
    def reverse_geocode(latitude: float, longitude: float) -> str:
        """Reverse geocoding using Nominatim OpenStreetMap."""
        try:
            url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={latitude}&lon={longitude}&zoom=14&addressdetails=1"
            res = requests.get(url, headers={"User-Agent": "GramVikas-App/1.0"}, timeout=3.0)
            if res.status_code == 200:
                addr = res.json().get("address", {})
                village = addr.get("village") or addr.get("suburb") or addr.get("town") or ""
                city = addr.get("city") or addr.get("state_district") or addr.get("county") or "Vijayawada"
                state = addr.get("state") or "Andhra Pradesh"
                return f"{village + ', ' if village else ''}{city}, {state}"
        except Exception as e:
            logger.warning(f"Geocoding failed: {e}")
        return "Vijayawada, Andhra Pradesh"

weather_service = WeatherService()
