import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import requests
from app.utils.disease_names import get_disease_info

BASE = 'http://127.0.0.1:8000/api'

info = get_disease_info('paddy_bacterial_leaf_blight')
treatments_te = [t.get('te', t.get('en', '')) for t in info['treatments']]
remedies_te = f"మొదటిగా, {treatments_te[0]}. " + (f"ఆ తర్వాత, {treatments_te[1]}. " if len(treatments_te) > 1 else "") + (f"మరియు {treatments_te[2]}." if len(treatments_te) > 2 else "")
disease_name_te = info['name']['te']
spoken_te = f"మీ పంటలో {disease_name_te} గుర్తించబడింది. నమ్మకం 94 శాతం. నివారణ చర్యలు: {remedies_te}"

print("=== 1. NATURAL TELUGU SPOKEN PRESCRIPTION ===")
print(spoken_te)

print()
print("=== 2. TTS AUDIO STREAM TEST ===")
r = requests.get(f'{BASE}/assistant/tts', params={'text': spoken_te, 'lang': 'te'})
print(f"TTS Stream Response: Status={r.status_code}, Bytes={len(r.content)}, Content-Type={r.headers.get('content-type')}")
