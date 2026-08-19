# backend/app/api/dashboard.py
from fastapi import APIRouter, Depends
from typing import Optional
from app.services.farm_service import farm_service
from app.core.security import get_current_user
import logging

router = APIRouter(prefix="/dashboard", tags=["Dashboard Aggregator"])
logger = logging.getLogger("gramvikas")

@router.get("")
async def get_dashboard_data(
    latitude: float = 16.5062,
    longitude: float = 80.6480,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Single unified dashboard payload:
    Returns farmer profile, active farm, active crop growth progress,
    live weather, smart irrigation status, disease alerts, yield forecast,
    and APMC Mandi commodity rates.
    """
    user_id = current_user.get("id") if current_user else None
    return farm_service.get_dashboard_summary(
        user_id=user_id,
        latitude=latitude,
        longitude=longitude
    )
