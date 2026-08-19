import requests

BASE = "http://127.0.0.1:8000/api"

tests = [
    ('Rice Conditions (N=80 P=40 K=40 pH=6.5)', {'nitrogen': 80, 'phosphorus': 40, 'potassium': 40, 'ph': 6.5, 'language': 'en'}),
    ('Cotton Conditions (N=120 P=45 K=20 pH=6.8)', {'nitrogen': 120, 'phosphorus': 45, 'potassium': 20, 'ph': 6.8, 'language': 'en'}),
    ('Chickpea Conditions (N=40 P=60 K=80 pH=7.5)', {'nitrogen': 40, 'phosphorus': 60, 'potassium': 80, 'ph': 7.5, 'language': 'te'}),
    ('Banana Conditions (N=100 P=75 K=50 pH=6.0)', {'nitrogen': 100, 'phosphorus': 75, 'potassium': 50, 'ph': 6.0, 'language': 'te'}),
    ('Maize Conditions (N=75 P=45 K=20 pH=6.2)', {'nitrogen': 75, 'phosphorus': 45, 'potassium': 20, 'ph': 6.2, 'language': 'en'}),
]

print("=== CROP MODEL — DIFFERENT INPUTS = DIFFERENT OUTPUTS ===")
for name, payload in tests:
    try:
        r = requests.post(f"{BASE}/crop/recommend", json=payload, timeout=30)
        if r.status_code == 200:
            data = r.json()
            recs = data.get('recommendations', [])
            top3 = [(x.get('name_en'), x.get('suitability_percent')) for x in recs[:3]]
            weather = data.get('weather_context', {})
            print(f"[{name}]")
            print(f"  Top 3: {top3}")
            print(f"  Weather used: {weather}")
        else:
            print(f"[{name}] ERROR {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"[{name}] EXCEPTION: {e}")

print()
print("=== TELUGU TTS ===")
try:
    t = requests.get(f"{BASE}/assistant/tts?text=మీ+వరి+పంటకు+నీరు+పెట్టే+సమయం+వచ్చింది&lang=te", timeout=15)
    ct = t.headers.get("content-type", "unknown")
    print(f"Status: {t.status_code}, Bytes: {len(t.content)}, Type: {ct}")
except Exception as e:
    print(f"TTS error: {e}")

print()
print("=== LAST RECOMMENDATION ENDPOINT ===")
try:
    lr = requests.get(f"{BASE}/crop/last-recommendation", timeout=10)
    print(f"Status: {lr.status_code} -> {lr.json()}")
except Exception as e:
    print(f"Error: {e}")
