# backend/app/api/irrigation.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.schemas.requests import IrrigationRequest, IrrigationLogRequest
from app.services.irrigation_service import irrigation_service
from app.core.security import get_current_user
import logging

router = APIRouter(prefix="/irrigation", tags=["Smart Irrigation"])
logger = logging.getLogger("gramvikas")

@router.post("/predict")
async def calculate_irrigation(req: IrrigationRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """Calculates optimal watering dosage & timing based on soil moisture and live weather."""
    user_id = current_user.get("id") if current_user else None
    try:
        plan = irrigation_service.calculate_plan(
            crop=req.crop,
            growth_stage=req.growth_stage,
            soil_moisture=req.soil_moisture,
            temperature=req.temperature,
            humidity=req.humidity,
            latitude=req.latitude,
            longitude=req.longitude,
            user_id=user_id,
            language=req.language
        )
        return plan
    except Exception as e:
        logger.error(f"Irrigation calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/log")
async def log_irrigation(req: IrrigationLogRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """Logs a completed watering event to update farm history and recalculate future dates."""
    user_id = current_user.get("id") if current_user else None
    if not user_id:
        return {"status": "success", "message": "Irrigation logged locally"}

    return irrigation_service.log_completed_irrigation(
        crop_id=req.crop_id or "default_crop",
        farm_id=req.farm_id or "default_farm",
        user_id=user_id,
        amount_liters=req.amount_liters,
        method=req.method
    )
