# backend/app/api/assistant.py
import io
import re
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import Response
from gtts import gTTS
from app.schemas.requests import ChatRequest
from app.services.groq_service import groq_service
from app.core.security import get_current_user

router = APIRouter(prefix="/assistant", tags=["AI Conversational Assistant"])
logger = logging.getLogger("gramvikas")

@router.post("/chat")
async def chat_with_assistant(req: ChatRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """Conversational agricultural assistant powered by Groq with multilingual voice support and multi-turn history."""
    try:
        reply = groq_service.chat_with_farmer(
            user_message=req.message,
            farmer_context=req.farmer_context,
            language=req.language,
            history=req.history
        )
        return {
            "status": "success",
            **reply
        }
    except Exception as e:
        logger.error(f"Chat assistant error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tts")
async def stream_text_to_speech(
    text: str = Query(..., min_length=1),
    lang: str = Query("te")
):
    """
    High-fidelity native Text-to-Speech audio streaming endpoint.
    Provides crystal-clear, natural Telugu (te), Hindi (hi), and Indian English (en) audio.
    Powered by gTTS with full sentence support and symbol-to-word expansion.
    """
    try:
        # Clean formatting characters
        clean_text = text
        clean_text = re.sub(r'[*_#`~\[\]|]', '', clean_text)

        # Language-specific symbol expansion
        if lang == "te":
            clean_text = clean_text.replace("₹", "రూపాయలు ").replace("%", " శాతం ")
            target_lang = "te"
        elif lang == "hi":
            clean_text = clean_text.replace("₹", "रुपये ").replace("%", " प्रतिशत ")
            target_lang = "hi"
        else:
            clean_text = clean_text.replace("₹", "Rupees ").replace("%", " percent ")
            target_lang = "en"

        # Remove URLs and extra whitespace
        clean_text = re.sub(r'https?://\S+', '', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()

        # Limit to 600 chars for responsive audio playback
        if len(clean_text) > 600:
            clean_text = clean_text[:600].rsplit(' ', 1)[0]

        if not clean_text:
            raise HTTPException(status_code=400, detail="No speakable text provided")

        # Generate audio using gTTS
        tts = gTTS(text=clean_text, lang=target_lang, slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        audio_content = fp.read()

        return Response(
            content=audio_content,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-cache",
                "Content-Disposition": "inline",
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS Streaming error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
