# backend/app/services/emergency_service.py
import logging
import requests
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.database import get_supabase_admin

logger = logging.getLogger("gramvikas")

EMERGENCY_ICONS = {
    "snake_bite": "🐍",
    "fire": "🔥",
    "electrical": "⚡",
    "machinery": "🚜",
    "flood": "🌪️",
    "injury": "🤕",
}

EMERGENCY_DISPLAY_NAMES = {
    "snake_bite": {"en": "Snake Bite", "te": "పాము కాటు"},
    "fire": {"en": "Farm Fire", "te": "పొలంలో మంటలు"},
    "electrical": {"en": "Electric Shock", "te": "విద్యుత్ షాక్"},
    "machinery": {"en": "Machinery Injury", "te": "యంత్ర ప్రమాదం"},
    "flood": {"en": "Flood / Storm", "te": "వరద ముంపు"},
    "injury": {"en": "Severe Injury", "te": "శారీరక గాయం"},
}

class EmergencyService:
    @staticmethod
    def send_sms(phone: str, message: str) -> bool:
        """
        Dispatches real emergency SMS alert via Fast2SMS API with high priority route.
        The message is kept concise (<140 chars) to ensure instantaneous single-credit delivery.
        """
        if not settings.FAST2SMS_API_KEY:
            logger.warning("Fast2SMS API Key not configured in environment")
            return False

        # Clean recipient phone number
        clean_phone = "".join(filter(str.isdigit, str(phone)))
        if len(clean_phone) == 12 and clean_phone.startswith("91"):
            clean_phone = clean_phone[2:]
        elif len(clean_phone) > 10:
            clean_phone = clean_phone[-10:]

        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            payload = {
                "route": "q",
                "message": message,
                "language": "english",
                "flash": 0,
                "numbers": clean_phone
            }
            headers = {
                "authorization": settings.FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            }
            res = requests.post(url, json=payload, headers=headers, timeout=6.0)
            if res.status_code == 200:
                data = res.json()
                if data.get("return"):
                    logger.info(f"✅ Emergency SMS dispatched via Fast2SMS to {clean_phone} (ID: {data.get('request_id')})")
                    return True
                else:
                    logger.warning(f"Fast2SMS API error: {data}")
            else:
                logger.warning(f"Fast2SMS API error ({res.status_code}): {res.text}")
        except Exception as e:
            logger.error(f"Failed to send emergency SMS: {e}")
        return False

    @staticmethod
    def trigger_sos(
        emergency_type: str,
        latitude: float,
        longitude: float,
        location_name: str,
        farmer_name: str = "Farmer Raju",
        farmer_phone: str = "9390616956",
        user_id: Optional[str] = None,
        farm_id: Optional[str] = None,
        language: str = "te"
    ) -> Dict[str, Any]:
        """
        Broadcasts Emergency SOS:
        1. Takes real-time GPS coordinates from app
        2. Formats concise, punchy SMS (Name, Emergency, Location, Maps)
        3. Dispatches SMS via Fast2SMS API
        4. Logs alert incident to Supabase
        5. Returns reassuring voice readout in Telugu / English
        """
        display_name_en = EMERGENCY_DISPLAY_NAMES.get(emergency_type, {}).get("en", emergency_type.replace("_", " ").title())
        display_name_te = EMERGENCY_DISPLAY_NAMES.get(emergency_type, {}).get("te", emergency_type)

        # Dynamic Google Maps Live Location Link
        maps_link = f"https://maps.google.com/?q={latitude:.4f},{longitude:.4f}"

        # Clean short location name
        loc_short = location_name.split(",")[0] if "," in location_name else location_name

        # Concise emergency SMS format: Name, Emergency, Location, Map
        sms_body = (
            f"GramVikas SOS Alert\n"
            f"Name: {farmer_name}\n"
            f"Emergency: {display_name_en}\n"
            f"Location: {loc_short}\n"
            f"Map: {maps_link}"
        )

        # Dispatch real SMS via Fast2SMS
        sms_sent = EmergencyService.send_sms(farmer_phone, sms_body)

        # Actionable First Aid Guidance
        emergency_protocols = {
            "snake_bite": {
                "title": {"en": "Snake Bite Protocol", "te": "పాము కాటు తక్షణ ప్రథమ చికిత్స"},
                "actions": [
                    {"en": "Keep the victim completely STILL and calm to prevent venom from circulating.", "te": "బాధితుడిని ఏమాత్రం కదలకుండా ప్రశాంతంగా ఉంచండి."},
                    {"en": "Call 108 Ambulance immediately or rush to the nearest hospital with Anti-Venom.", "te": "వెంటనే 108 అంబులెన్స్‌కు కాల్ చేయండి లేదా ఆసుపత్రికి తరలించండి."},
                    {"en": "DO NOT cut the wound, do not suck venom, and do not tie tight tourniquets.", "te": "గాయంపై కోయడం, రక్తం పీల్చడం లేదా గట్టిగా కట్లు కట్టడం చేయవద్దు."}
                ]
            },
            "fire": {
                "title": {"en": "Field Fire Protocol", "te": "పొలంలో అగ్ని ప్రమాద నివారణ"},
                "actions": [
                    {"en": "Evacuate upwind immediately to an open area away from smoke.", "te": "పొగ మరియు మంటలు లేని సురక్షితమైన ప్రదేశానికి వెంటనే వెళ్ళండి."},
                    {"en": "Call Fire Station: 101 immediately.", "te": "వెంటనే అగ్నిమాపక కేంద్రం 101 కు కాల్ చేయండి."},
                    {"en": "Alert adjacent farmers to wet boundary lines.", "te": "పక్క పొలాల రైతులకు సమాచారం అందించి రక్షణ చర్యలు చేపట్టండి."}
                ]
            },
            "electrical": {
                "title": {"en": "Electrical Emergency Protocol", "te": "విద్యుత్ ప్రమాద నివారణ చర్యలు"},
                "actions": [
                    {"en": "DO NOT touch the victim directly. Use a dry wooden stick.", "te": "బాధితుడిని నేరుగా తాకవద్దు. పొడి చెక్క లేదా కర్ర ఉపయోగించండి."},
                    {"en": "Switch off the main motor starter switch immediately.", "te": "వెంటనే విద్యుత్ మెయిన్ స్విచ్ లేదా మోటార్ స్టార్టర్ ఆఫ్ చేయండి."},
                    {"en": "Call 108 for medical support and 1912 for Electricity Board.", "te": "వైద్యం కోసం 108 మరియు విద్యుత్ శాఖ కోసం 1912 కు కాల్ చేయండి."}
                ]
            },
            "machinery": {
                "title": {"en": "Machinery Injury Protocol", "te": "యంత్ర ప్రమాద ప్రథమ చికిత్స"},
                "actions": [
                    {"en": "Apply firm, direct pressure with a clean cloth to stop severe bleeding.", "te": "రక్తస్రావాన్ని ఆపడానికి శుభ్రమైన గుడ్డతో గాయంపై గట్టిగా నొక్కండి."},
                    {"en": "Keep the injured limb elevated above heart level if possible.", "te": "వీలైతే గాయపడిన భాగాన్ని గుండె స్థాయి కంటే ఎత్తులో ఉంచండి."},
                    {"en": "Call 108 Ambulance immediately.", "te": "వెంటనే 108 అంబులెన్స్‌కు కాల్ చేసి ఆసుపత్రికి తరలించండి."}
                ]
            },
            "flood": {
                "title": {"en": "Flood / Storm Safety Protocol", "te": "తుఫాను మరియు వరద రక్షణ"},
                "actions": [
                    {"en": "Move livestock and family immediately to designated high ground or cyclone shelters.", "te": "పశువులను మరియు కుటుంబాన్ని వెంటనే ఎత్తైన ప్రదేశాలకు తరలించండి."},
                    {"en": "Avoid walking or driving through moving water or flooded streams.", "te": "ప్రవహించే వరద నీటిలో నడవద్దు లేదా వాహనాలు నడపవద్దు."},
                    {"en": "Keep mobile phones charged in waterproof bags and listen to disaster warnings.", "te": "ఫోన్లను వాటర్‌ప్రూఫ్ కవర్లలో భద్రపరుచుకోండి."}
                ]
            },
            "injury": {
                "title": {"en": "General Field Trauma Protocol", "te": "తీవ్ర గాయాల ప్రథమ చికిత్స"},
                "actions": [
                    {"en": "Check breathing and pulse. Maintain open airway.", "te": "శ్వాస మరియు నాడిని తనిఖీ చేయండి."},
                    {"en": "Immobilize suspected bone fractures using a simple splint.", "te": "ఎముక విరిగినట్లు అనుమానం ఉంటే కదలకుండా పట్టీ వేయండి."},
                    {"en": "Dial 108 immediately for urgent paramedic transport.", "te": "వెంటనే 108 అంబులెన్స్‌కు కాల్ చేయండి."}
                ]
            }
        }

        guide = emergency_protocols.get(emergency_type, emergency_protocols["snake_bite"])

        # Spoken reassuring voice message
        spoken_alert = {
            "te": f"అత్యవసర సహాయ అభ్యర్థన పంపబడింది. సహాయం త్వరలోనే వస్తుంది. దయచేసి ప్రశాంతంగా ఉండండి.",
            "hi": f"आपातकालीन सहायता संदेश भेज दिया गया है। मदद जल्द ही पहुंचेगी। कृपया शांत रहें।",
            "en": f"Emergency response dispatched. Help will arrive soon. Please remain calm."
        }

        # Persist alert record to Supabase
        supabase = get_supabase_admin()
        if supabase and user_id:
            try:
                supabase.table("emergency_alerts").insert({
                    "user_id": user_id,
                    "farm_id": farm_id,
                    "emergency_type": emergency_type,
                    "location_lat": latitude,
                    "location_lon": longitude,
                    "location_name": location_name,
                    "sms_status": "sent" if sms_sent else "failed",
                    "recipient_phone": farmer_phone,
                    "message_body": sms_body
                }).execute()
            except Exception as e:
                logger.error(f"Failed to log emergency alert to Supabase: {e}")

        return {
            "status": "success",
            "sms_sent": sms_sent,
            "emergency_type": emergency_type,
            "display_name": display_name_te if language == "te" else display_name_en,
            "latitude": latitude,
            "longitude": longitude,
            "location_name": location_name,
            "maps_url": maps_link,
            "sms_body": sms_body,
            "guide": guide,
            "spoken_alert": spoken_alert,
            "language": language,
            "speech_language": "te-IN" if language == "te" else "hi-IN" if language == "hi" else "en-IN"
        }

emergency_service = EmergencyService()
