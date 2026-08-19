# backend/app/api/disease_detection.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import Optional
from app.services.disease_service import disease_service
from app.core.security import get_current_user
import logging

router = APIRouter(prefix="/disease", tags=["Disease Detection"])
logger = logging.getLogger("gramvikas")

@router.post("/predict")
async def detect_disease(
    file: UploadFile = File(...),
    language: str = Form("te"),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Accepts crop leaf photo, runs multi-stage image validation (rejects non-plants/selfies/blur),
    executes Keras model inference for 20 disease classes, and returns treatments with audio advice.
    """
    try:
        image_bytes = await file.read()
        user_id = current_user.get("id") if current_user else None

        result = await disease_service.diagnose_leaf(
            image_bytes=image_bytes,
            filename=file.filename or "leaf.jpg",
            user_id=user_id,
            language=language
        )
        return result
    except Exception as e:
        logger.error(f"Disease detection API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
