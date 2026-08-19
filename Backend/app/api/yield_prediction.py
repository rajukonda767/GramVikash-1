# backend/app/api/yield_prediction.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.schemas.requests import YieldPredictRequest
from app.services.yield_service import yield_service
from app.core.security import get_current_user
import logging

router = APIRouter(prefix="/yield", tags=["Yield Prediction"])
logger = logging.getLogger("gramvikas")

@router.post("/predict")
async def predict_crop_yield(req: YieldPredictRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """Runs Yield Prediction ML model and returns harvest forecast with growth factor impacts."""
    user_id = current_user.get("id") if current_user else None
    try:
        result = yield_service.estimate_yield(
            crop=req.crop,
            area_acres=req.area_acres,
            season=req.season,
            state=req.state,
            annual_rainfall=req.rainfall_mm,
            fertilizer_kg=req.fertilizer_kg,
            pesticide_kg=req.pesticide_kg,
            user_id=user_id,
            language=req.language
        )
        return result
    except Exception as e:
        logger.error(f"Yield prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
