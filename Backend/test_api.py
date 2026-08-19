# backend/test_api.py
import requests
import json
import io
import numpy as np
from PIL import Image

BASE_URL = "http://127.0.0.1:8000"

def test_all():
    print("==================================================")
    print("[TEST] GRAMVIKAS PRODUCTION BACKEND & ML APIS")
    print("==================================================")

    # 1. Health check
    r = requests.get(f"{BASE_URL}/health")
    print("1. /health:", r.status_code, r.json())
    assert r.status_code == 200
    assert r.json()["models_loaded"] is True

    # 2. Dashboard
    r = requests.get(f"{BASE_URL}/api/dashboard")
    print("2. /api/dashboard:", r.status_code, "Farmer:", r.json().get("farmer", {}).get("name"), "Weather temp:", r.json().get("weather", {}).get("temperature"))
    assert r.status_code == 200

    # 3. Crop Recommendation (Direct NPK)
    payload_npk = {
        "nitrogen": 82.0, "phosphorus": 42.0, "potassium": 48.0, "ph": 6.5,
        "temperature": 28.0, "humidity": 70.0, "rainfall": 150.0,
        "language": "en"
    }
    r = requests.post(f"{BASE_URL}/api/crop/recommend", json=payload_npk)
    top_c = r.json().get("recommendations", [{}])[0]
    print("3. /api/crop/recommend (NPK):", r.status_code, "Top crop:", top_c.get("name_en"), "Confidence:", top_c.get("confidence"))
    assert r.status_code == 200

    # 4. Crop Recommendation (Unknown NPK 4-question Flow)
    payload_unknown = {
        "farmer_questions": {
            "previous_crop": "Black Gram",
            "previous_yield_quality": "Good",
            "soil_type": "Black Soil",
            "drainage": "Normally"
        },
        "language": "en"
    }
    r = requests.post(f"{BASE_URL}/api/crop/recommend", json=payload_unknown)
    print("4. /api/crop/recommend (Unknown NPK):", r.status_code, "Source:", r.json().get("source"), "Inferred N:", r.json().get("soil_inputs", {}).get("nitrogen"))
    assert r.status_code == 200

    # 5. Disease Detection - Valid Plant Leaf Test (Green leaf with texture)
    arr = np.full((300, 300, 3), [34, 139, 34], dtype=np.uint8)
    arr[50:150, 50:150] = [139, 69, 19] # brown necrosis spot
    img_leaf = Image.fromarray(arr)
    buf_leaf = io.BytesIO()
    img_leaf.save(buf_leaf, format="JPEG")
    buf_leaf.seek(0)

    files = {"file": ("leaf.jpg", buf_leaf.getvalue(), "image/jpeg")}
    data = {"language": "en"}
    r = requests.post(f"{BASE_URL}/api/disease/predict", files=files, data=data)
    print("5. /api/disease/predict (Valid Leaf):", r.status_code, "Status:", r.json().get("status"), "Disease:", r.json().get("disease_name", {}).get("en"))
    assert r.status_code == 200

    # 6. Disease Detection - Invalid Non-Plant Image Test (e.g. blue vehicle / wall)
    img_blue = Image.new("RGB", (300, 300), color=(10, 30, 220)) # Pure blue
    buf_blue = io.BytesIO()
    img_blue.save(buf_blue, format="JPEG")
    buf_blue.seek(0)

    files_bad = {"file": ("car.jpg", buf_blue.getvalue(), "image/jpeg")}
    r = requests.post(f"{BASE_URL}/api/disease/predict", files=files_bad, data=data)
    print("6. /api/disease/predict (Non-Plant Rejection):", r.status_code, "Status:", r.json().get("status"), "Message:", r.json().get("message"))
    assert r.status_code == 200
    assert r.json().get("status") == "invalid_image"

    # 7. Yield Prediction ML
    payload_yield = {
        "crop": "Rice", "area_acres": 3.5, "season": "Kharif", "state": "Andhra Pradesh",
        "rainfall_mm": 850.0, "fertilizer_kg": 120.0, "pesticide_kg": 2.5,
        "language": "en"
    }
    r = requests.post(f"{BASE_URL}/api/yield/predict", json=payload_yield)
    print("7. /api/yield/predict (ML Model):", r.status_code, "Total Yield:", r.json().get("predicted_total_yield_tonnes"), "Tonnes")
    assert r.status_code == 200

    # 8. Irrigation Prediction
    payload_irr = {
        "crop": "Paddy", "growth_stage": "Vegetative Stage", "soil_moisture": 45.0,
        "language": "en"
    }
    r = requests.post(f"{BASE_URL}/api/irrigation/predict", json=payload_irr)
    print("8. /api/irrigation/predict:", r.status_code, "Urgency:", r.json().get("urgency"), "Timing:", r.json().get("timing", {}).get("en"))
    assert r.status_code == 200

    # 9. Market Mandi Rates
    r = requests.get(f"{BASE_URL}/api/market/prices")
    print("9. /api/market/prices:", r.status_code, "Count:", len(r.json().get("prices", [])))
    assert r.status_code == 200

    # 10. AI Chat with Groq in Telugu/English
    payload_chat = {
        "message": "When should I irrigate my paddy field?",
        "language": "en"
    }
    r = requests.post(f"{BASE_URL}/api/assistant/chat", json=payload_chat)
    preview = r.json().get("text", "")[:60].encode("ascii", "ignore").decode()
    print("10. /api/assistant/chat (Groq):", r.status_code, "Speech Lang:", r.json().get("speech_language"), "Reply preview:", preview)
    assert r.status_code == 200

    print("==================================================")
    print("[SUCCESS] ALL 10 PRODUCTION ENDPOINTS & ML MODELS TESTED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    test_all()
