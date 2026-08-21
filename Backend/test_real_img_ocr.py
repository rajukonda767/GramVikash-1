import io
import sys
import json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from groq import Groq
from app.core.config import settings
from app.services.soil_ocr_service import soil_ocr_service

img_path = r'C:/Users/rajuk/.gemini/antigravity/brain/e0e0681f-7de9-4fdb-9b1d-080080176814/.user_uploaded/media_1787332032687.png'

with open(img_path, 'rb') as f:
    img_bytes = f.read()

res = soil_ocr_service.parse_soil_document(
    file_bytes=img_bytes,
    filename="bangalore_soil_report.png",
    content_type="image/png",
    language="te"
)

print("=== FINAL SOIL OCR RESULT FOR REAL IMAGE ===")
print(json.dumps(res, indent=2, ensure_ascii=False))
