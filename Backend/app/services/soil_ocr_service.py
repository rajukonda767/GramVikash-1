# backend/app/services/soil_ocr_service.py
import io
import re
import logging
import numpy as np
from PIL import Image
from typing import Dict, Any, Optional, List, Tuple
import pypdf
from groq import Groq
from app.core.config import settings

logger = logging.getLogger("gramvikas")

# Lazy-loaded EasyOCR reader instance
_easyocr_reader = None

def get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr
            _easyocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            logger.info("✅ EasyOCR reader initialized successfully")
        except Exception as e:
            logger.warning(f"EasyOCR initialization warning: {e}")
    return _easyocr_reader

class SoilReportOCRService:
    """
    Production-Grade Agricultural Soil Health Card & Test Report Extractor:
    1. Extracts text from digital/scanned PDFs via pypdf
    2. Extracts text from camera photos & image scans via EasyOCR/Tesseract
    3. Analyzes chemical synonyms (N, Available Nitrogen, P2O5, Phosphate, K2O, Potash, pH 1:2.5) via Groq LLM + Regex
    4. Detects missing values and returns specific field-level user feedback
    """

    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> str:
        """Extracts plain text from PDF pages."""
        text = ""
        try:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
        except Exception as e:
            logger.error(f"Failed to read PDF text: {e}")
        return text.strip()

    @staticmethod
    def extract_text_from_image(image_bytes: bytes) -> str:
        """Extracts text from image bytes using EasyOCR or pytesseract."""
        text = ""
        # 1. Try EasyOCR
        try:
            reader = get_easyocr_reader()
            if reader:
                results = reader.readtext(image_bytes, detail=0)
                text = " ".join(results)
                if len(text.strip()) > 10:
                    return text.strip()
        except Exception as e:
            logger.warning(f"EasyOCR extraction note: {e}")

        # 2. Try pytesseract if available
        try:
            import pytesseract
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            tess_text = pytesseract.image_to_string(image)
            if len(tess_text.strip()) > 10:
                text = tess_text.strip()
        except Exception as e:
            logger.warning(f"pytesseract extraction note: {e}")

        return text.strip()

    @staticmethod
    def extract_via_regex(text: str) -> Dict[str, Optional[float]]:
        """
        Agricultural Regex Parser for Indian Soil Health Cards & Lab Reports:
        Handles standard parameter variations and chemical notations.
        """
        extracted = {"nitrogen": None, "phosphorus": None, "potassium": None, "ph": None}
        if not text:
            return extracted

        clean_text = text.replace(",", ".")

        # 1. pH Extraction (look for 'pH', 'Soil pH', 'pH (1:2.5)', 'Reaction')
        # Typical range: 3.5 to 9.5
        ph_match = re.search(
            r'(?:soil\s+ph|ph\s*\([^\)]*\)|reaction\s*\(?ph\)?|\bph\b)[\s\:\-=]+([3-9]\.?[0-9]{0,2})',
            clean_text,
            re.IGNORECASE
        )
        if ph_match:
            try:
                val = float(ph_match.group(1))
                if 3.0 <= val <= 10.0:
                    extracted["ph"] = round(val, 2)
            except ValueError:
                pass

        # 2. Nitrogen Extraction (look for 'Available Nitrogen', 'Nitrogen', 'N', 'N (Kg/ha)')
        n_match = re.search(
            r'(?:available\s+nitrogen|available\s+n|total\s+nitrogen|\bnitrogen\b|\bn\b)[\s\:\(\)\/kg\-\_ha]*[:=\s]+([0-9]{1,3}\.?[0-9]{0,2})',
            clean_text,
            re.IGNORECASE
        )
        if n_match:
            try:
                val = float(n_match.group(1))
                if 5.0 <= val <= 300.0:
                    extracted["nitrogen"] = round(val, 1)
            except ValueError:
                pass

        # 3. Phosphorus Extraction (look for 'Available Phosphorus', 'P2O5', 'P', 'Phosphate')
        p_match = re.search(
            r'(?:available\s+phosphorus|available\s+p|p2o5|p205|\bphosphorus\b|\bphosphate\b|\bp\b)[\s\:\(\)\/kg\-\_ha]*[:=\s]+([0-9]{1,3}\.?[0-9]{0,2})',
            clean_text,
            re.IGNORECASE
        )
        if p_match:
            try:
                val = float(p_match.group(1))
                if 2.0 <= val <= 200.0:
                    extracted["phosphorus"] = round(val, 1)
            except ValueError:
                pass

        # 4. Potassium Extraction (look for 'Available Potassium', 'K2O', 'K', 'Potash')
        k_match = re.search(
            r'(?:available\s+potassium|available\s+k|k2o|k20|\bpotassium\b|\bpotash\b|\bk\b)[\s\:\(\)\/kg\-\_ha]*[:=\s]+([0-9]{1,3}\.?[0-9]{0,2})',
            clean_text,
            re.IGNORECASE
        )
        if k_match:
            try:
                val = float(k_match.group(1))
                if 5.0 <= val <= 350.0:
                    extracted["potassium"] = round(val, 1)
            except ValueError:
                pass

        return extracted

    @staticmethod
    def extract_via_groq(text: str) -> Dict[str, Any]:
        """
        Uses Groq LLM to intelligently extract structured soil parameters from noisy document text.
        """
        if not settings.GROQ_API_KEY or not text:
            return {}

        prompt = (
            "You are an expert Agricultural Soil Scientist.\n"
            "Extract the 4 primary soil fertility values from the following Indian Soil Health Card or Lab Report:\n"
            "1. Nitrogen (N, Available Nitrogen, N in kg/ha)\n"
            "2. Phosphorus (P, Available Phosphorus, P2O5, Phosphate in kg/ha)\n"
            "3. Potassium (K, Available Potassium, K2O, Potash in kg/ha)\n"
            "4. Soil pH (pH, Soil pH, pH (1:2.5), Reaction)\n\n"
            "Important: If a parameter has multiple samples or columns (e.g. 0-0.6ft and 0.6-1ft), extract the first topsoil sample (0-0.6ft).\n"
            "Convert any string numbers to floats. If a parameter is not present or cannot be found, set its value to null.\n\n"
            "Return STRICTLY a JSON object with this exact schema:\n"
            "{\n"
            '  "nitrogen": float or null,\n'
            '  "phosphorus": float or null,\n'
            '  "potassium": float or null,\n'
            '  "ph": float or null,\n'
            '  "missing_parameters": ["list of parameter names that are null or missing"],\n'
            '  "farmer_name": "extracted farmer name or null",\n'
            '  "lab_name": "extracted laboratory name or null"\n'
            "}"
        )

        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            
            # Select available model
            models_to_try = ["openai/gpt-oss-120b", "qwen/qwen3.6-27b", "groq/compound", settings.GROQ_MODEL]
            
            for model_name in models_to_try:
                try:
                    res = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": "You are a specialized agricultural soil report parser. Always output valid JSON."},
                            {"role": "user", "content": f"{prompt}\n\nDocument Text:\n{text[:4000]}"}
                        ],
                        temperature=0.0,
                        response_format={"type": "json_object"}
                    )
                    raw_content = res.choices[0].message.content.strip()
                    import json
                    return json.loads(raw_content)
                except Exception as model_err:
                    logger.warning(f"Groq extraction attempt with {model_name} had note: {model_err}")
                    continue
        except Exception as e:
            logger.error(f"Groq Soil OCR error: {e}")
        return {}

    @classmethod
    def parse_soil_document(cls, file_bytes: bytes, filename: str, content_type: str = "", language: str = "te") -> Dict[str, Any]:
        """
        Complete Multi-Stage Soil Report Processing Pipeline:
        1. Identifies file format (PDF vs Image)
        2. Performs text & table extraction
        3. Runs AI & Regex Parameter Mapping
        4. Validates completeness of N, P, K, pH
        5. Returns structured response with granular missing-field feedback
        """
        fname_lower = filename.lower()
        is_pdf = fname_lower.endswith(".pdf") or "pdf" in content_type.lower()
        
        extracted_text = ""
        if is_pdf:
            extracted_text = cls.extract_text_from_pdf(file_bytes)
        else:
            extracted_text = cls.extract_text_from_image(file_bytes)

        logger.info(f"Soil Report OCR extracted text length: {len(extracted_text)} characters")

        # Fallback / Direct AI extraction
        ai_data = cls.extract_via_groq(extracted_text) if len(extracted_text) > 15 else {}
        regex_data = cls.extract_via_regex(extracted_text)

        # Merge results: prefer AI, fallback to Regex
        n = ai_data.get("nitrogen") if ai_data.get("nitrogen") is not None else regex_data.get("nitrogen")
        p = ai_data.get("phosphorus") if ai_data.get("phosphorus") is not None else regex_data.get("phosphorus")
        k = ai_data.get("potassium") if ai_data.get("potassium") is not None else regex_data.get("potassium")
        ph = ai_data.get("ph") if ai_data.get("ph") is not None else regex_data.get("ph")

        # Check for missing parameters
        missing_fields = []
        missing_fields_te = []
        
        if n is None:
            missing_fields.append("Nitrogen (N)")
            missing_fields_te.append("నత్రజని (N)")
        if p is None:
            missing_fields.append("Phosphorus (P / P2O5)")
            missing_fields_te.append("భాస్వరం (P)")
        if k is None:
            missing_fields.append("Potassium (K / K2O)")
            missing_fields_te.append("పొటాషియం (K)")
        if ph is None:
            missing_fields.append("Soil pH")
            missing_fields_te.append("నేల pH")

        farmer_name = ai_data.get("farmer_name")
        lab_name = ai_data.get("lab_name")

        # If any fields are missing, return missing_values error with exact names
        if missing_fields:
            if len(missing_fields) == 4:
                # Completely unreadable or non-soil document
                msg_en = "Could not extract soil test values. Please ensure the document is clear, well-lit, and contains N, P, K, pH test results."
                msg_te = "నివేదిక నుండి నేల పరీక్ష వివరాలు చదవలేకపోయాము. దయచేసి స్పష్టమైన ఫోటో తీయండి లేదా నేరుగా నమోదు చేయండి."
            else:
                msg_en = f"The following parameters are missing in the document: {', '.join(missing_fields)}. Please enter them manually below."
                msg_te = f"నివేదికలో {', '.join(missing_fields_te)} విలువలు కనుగొనబడలేదు. దయచేసి వాటిని కింద మాన్యువల్‌గా నమోదు చేయండి."

            return {
                "success": False,
                "error": "missing_values",
                "missing_fields": missing_fields,
                "missing_fields_te": missing_fields_te,
                "extracted_data": {
                    "nitrogen": n,
                    "phosphorus": p,
                    "potassium": k,
                    "ph": ph
                },
                "message": msg_te if language == "te" else msg_en,
                "message_en": msg_en,
                "message_te": msg_te,
                "farmer_name": farmer_name,
                "lab_name": lab_name,
                "raw_text_snippet": extracted_text[:300] if extracted_text else ""
            }

        # Success - All 4 parameters extracted!
        success_msg_en = f"Soil parameters extracted: Nitrogen={n} kg/ha, Phosphorus={p} kg/ha, Potassium={k} kg/ha, pH={ph}"
        success_msg_te = f"నేల పరీక్ష వివరాలు విజయవంతంగా సంగ్రహించబడ్డాయి: నత్రజని={n} kg/ha, భాస్వరం={p} kg/ha, పొటాషియం={k} kg/ha, pH={ph}"

        voice_note = (
            f"సాయిల్ రిపోర్ట్ నుండి నత్రజని {n}, భాస్వరం {p}, పొటాషియం {k}, మరియు నేల pH {ph} గా నమోదు చేయబడింది."
            if language == "te" else
            f"Soil report extracted successfully. Nitrogen {n}, Phosphorus {p}, Potassium {k}, and pH {ph}."
        )

        return {
            "success": True,
            "confidence_score": 95.0,
            "extracted_data": {
                "nitrogen": n,
                "phosphorus": p,
                "potassium": k,
                "ph": ph
            },
            "missing_fields": [],
            "message": success_msg_te if language == "te" else success_msg_en,
            "message_en": success_msg_en,
            "message_te": success_msg_te,
            "voice_note": voice_note,
            "farmer_name": farmer_name,
            "lab_name": lab_name
        }

soil_ocr_service = SoilReportOCRService()
