# backend/app/api/emergency.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.schemas.requests import EmergencySOSRequest
from app.services.emergency_service import emergency_service
from app.core.security import get_current_user
import logging

router = APIRouter(prefix="/emergency", tags=["Emergency SOS"])
logger = logging.getLogger("gramvikas")

@router.post("/sos")
async def trigger_emergency_sos(req: EmergencySOSRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """Dispatches real emergency SOS with live GPS coordinates via SMS, logs to DB, and returns first-aid guides."""
    user_id = current_user.get("id") if current_user else None
    try:
        res = emergency_service.trigger_sos(
            emergency_type=req.emergency_type,
            latitude=req.latitude,
            longitude=req.longitude,
            location_name=req.location_name,
            farmer_name=req.farmer_name,
            farmer_phone=req.farmer_phone,
            user_id=user_id,
            language=req.language
        )
        return res
    except Exception as e:
        logger.error(f"Emergency SOS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
