import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import requests

BASE = 'http://127.0.0.1:8000/api'

print('=== 1. TEST GROQ AI ASSISTANT (TOMATO PRICE IN TELUGU) ===')
q1_res = requests.post(f'{BASE}/assistant/chat', json={
    'message': 'ఈరోజు టమాటా పంట ధర ఎంత?',
    'language': 'te',
    'farmer_context': {
        'name': 'Raju',
        'location': 'Vijayawada, NTR District, Andhra Pradesh',
        'crop': 'Paddy (వరి)',
        'land_size': '3.5 acres',
        'soil_moisture': '68%'
    }
})
if q1_res.status_code == 200:
    reply1 = q1_res.json().get('text', '')
    print('Q1: "ఈరోజు టమాటా పంట ధర ఎంత?"')
    print('AI Reply:', reply1)
    
    # Test multi-turn follow-up query
    print()
    print('=== 2. TEST MULTI-TURN CHAT CONTINUATION ===')
    history = [
        {'role': 'user', 'content': 'ఈరోజు టమాటా పంట ధర ఎంత?'},
        {'role': 'assistant', 'content': reply1}
    ]
    q2_res = requests.post(f'{BASE}/assistant/chat', json={
        'message': 'మరి నా వరి పంటకు నీరు ఎప్పుడు పెట్టాలి?',
        'language': 'te',
        'history': history,
        'farmer_context': {
            'name': 'Raju',
            'location': 'Vijayawada, NTR District, Andhra Pradesh',
            'crop': 'Paddy (వరి)',
            'land_size': '3.5 acres',
            'soil_moisture': '68%'
        }
    })
    if q2_res.status_code == 200:
        reply2 = q2_res.json().get('text', '')
        print('Q2 (Follow-up): "మరి నా వరి పంటకు నీరు ఎప్పుడు పెట్టాలి?"')
        print('AI Reply 2:', reply2)
        
        # Test TTS stream
        tts_res = requests.get(f'{BASE}/assistant/tts', params={'text': reply2, 'lang': 'te'})
        print(f'TTS Audio Stream: Status={tts_res.status_code}, Bytes={len(tts_res.content)}, Content-Type={tts_res.headers.get("content-type")}')
    else:
        print('Q2 Error:', q2_res.status_code, q2_res.text)
else:
    print('Q1 Error:', q1_res.status_code, q1_res.text)

print()
print('=== 3. TEST EMERGENCY SOS & CUSTOM SMS DISPATCH ===')
sos_res = requests.post(f'{BASE}/emergency/sos', json={
    'emergency_type': 'snake_bite',
    'latitude': 16.5062,
    'longitude': 80.6480,
    'location_name': 'Vijayawada, NTR District, Andhra Pradesh',
    'farmer_name': 'Raju',
    'farmer_phone': '9390616956',
    'language': 'te'
})
if sos_res.status_code == 200:
    sos_data = sos_res.json()
    print('SOS Status:', sos_data.get('status'))
    print('SMS Dispatched:', sos_data.get('sms_dispatched'))
    print('Maps URL:', sos_data.get('maps_url'))
    print('Custom SMS Content:\n', sos_data.get('sms_preview'))
else:
    print('SOS Error:', sos_res.status_code, sos_res.text)
