import base64
import json
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

# Test 1: Real Text from Image 4 (Bangalore report)
report_text = """
UNIVERSITY OF AGRICULTURAL SCIENCES GKVK, BANGALORE
DEPARTMENT OF SOIL SCIENCE AND AGRICULTURAL CHEMISTRY
Parameters:
pH (1:2.5): 7.83
EC (1:2.5)(ds/m): 0.14
OC (%): 0.21
N (Kg / ha): 100.35
P2O5 (Kg / ha): 18.64
K2O (Kg / ha): 134.4
CEC: 13.45
"""

prompt = """
You are an expert Agricultural Soil Scientist and Data Extraction AI.
Extract the 4 primary soil parameters needed for crop modeling from the soil health card or lab report:
1. Nitrogen (look for 'N', 'Available Nitrogen', 'Available N', 'Nitrogen', 'N (Kg/ha)') -> value in kg/ha
2. Phosphorus (look for 'P', 'Available Phosphorus', 'P2O5', 'Available P', 'Phosphate') -> value in kg/ha
3. Potassium (look for 'K', 'Available Potassium', 'K2O', 'Available K', 'Potash') -> value in kg/ha
4. Soil pH (look for 'pH', 'Soil pH', 'pH (1:2.5)', 'Reaction') -> value (typical range 3.5 to 9.5)

Return STRICTLY a JSON object with this exact structure:
{
  "nitrogen": number or null,
  "phosphorus": number or null,
  "potassium": number or null,
  "ph": number or null,
  "missing_parameters": ["list of parameters that are missing or null"],
  "farmer_name": "extracted name or null",
  "lab_name": "extracted lab or null",
  "extracted_parameters": {
     "nitrogen_raw": "raw text matched",
     "phosphorus_raw": "raw text matched",
     "potassium_raw": "raw text matched",
     "ph_raw": "raw text matched"
  }
}
"""

res = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "system", "content": "You are a specialized agricultural OCR parser. Always respond in valid JSON."},
        {"role": "user", "content": f"{prompt}\n\nDocument Text:\n{report_text}"}
    ],
    temperature=0.0,
    response_format={"type": "json_object"}
)

print("Test 1 Result (Bangalore Report Text):")
print(res.choices[0].message.content)
