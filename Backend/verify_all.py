import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests

BASE = 'http://127.0.0.1:8000/api'

print('=== 1. TEST YIELD PREDICTION ===')
for crop, area in [('Rice', 3.5), ('Maize', 3.5), ('Cotton', 3.5), ('Tomato', 2.0), ('Banana', 1.0)]:
    r = requests.post(f'{BASE}/yield/predict', json={
        'crop': crop,
        'area_acres': area,
        'season': 'Kharif',
        'rainfall_mm': 850,
        'fertilizer_kg': 120,
        'pesticide_kg': 2.5,
        'language': 'te'
    })
    if r.status_code == 200:
        data = r.json()
        tot = data.get('predicted_total_yield_tonnes')
        ypa = data.get('yield_per_acre')
        spk = data.get('spoken_summary', {}).get('te', '')
        print(f"[{crop} ({area} ac)] -> Total: {tot} Tonnes, Rate: {ypa} T/ac")
        print(f"   Spoken TE: {spk[:60]}...")
    else:
        print(f"[{crop}] ERROR {r.status_code}")

print()
print('=== 2. TEST CHATBOT & TTS (TELUGU) ===')
chat_r = requests.post(f'{BASE}/assistant/chat', json={
    'message': 'వరి పంటలో ఆకు ఎండు తెగులు వస్తే ఏమి చేయాలి?',
    'language': 'te',
    'farmer_context': {'name': 'Raju', 'location': 'Vijayawada'}
})
if chat_r.status_code == 200:
    reply = chat_r.json().get('text', '')
    print(f"AI Reply ({len(reply)} chars): {reply[:100]}...")
    
    # Test TTS with this Telugu response
    tts_r = requests.get(f'{BASE}/assistant/tts', params={'text': reply, 'lang': 'te'})
    print(f"TTS Stream -> Status: {tts_r.status_code}, Bytes: {len(tts_r.content)}, Content-Type: {tts_r.headers.get('content-type')}")
else:
    print(f"Chat error: {chat_r.status_code}")
