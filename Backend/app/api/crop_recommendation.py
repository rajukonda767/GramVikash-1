# backend/app/api/crop_recommendation.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.schemas.requests import CropRecommendRequest
from app.services.crop_service import crop_service
from app.core.security import get_current_user
from app.core.database import get_supabase_admin
import logging

router = APIRouter(prefix="/crop", tags=["Crop Recommendation"])
logger = logging.getLogger("gramvikas")

@router.post("/recommend")
async def recommend_crop(req: CropRecommendRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """
    Predicts Top 3 recommended crops using the trained Random Forest ML model.
    Temperature, humidity, and rainfall come from live weather API (Open-Meteo).
    Supports direct NPK/pH inputs or 4-question farmer inference mode.
    """
    user_id = current_user.get("id") if current_user else None

    try:
        result = await crop_service.recommend_crops(
            n=req.nitrogen,
            p=req.phosphorus,
            k=req.potassium,
            ph=req.ph,
            temperature=None,    # Always fetch from live weather — farmer doesn't need to enter this
            humidity=None,       # Always fetch from live weather — farmer doesn't need to enter this
            rainfall=None,       # Use regional baseline
            latitude=req.latitude,
            longitude=req.longitude,
            location_name=req.location_name,
            farmer_questions=req.farmer_questions,
            user_id=user_id,
            language=req.language
        )
        return result
    except Exception as e:
        logger.error(f"Crop recommendation API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/last-recommendation")
async def get_last_recommendation(current_user: Optional[dict] = Depends(get_current_user)):
    """
    Retrieves the last saved crop recommendation from Supabase for the authenticated user.
    Returns 1 most recent record only.
    """
    user_id = current_user.get("id") if current_user else None
    if not user_id:
        return {"status": "no_data", "recommendation": None}

    supabase = get_supabase_admin()
    if not supabase:
        return {"status": "no_data", "recommendation": None}

    try:
        res = (
            supabase.table("crop_recommendations")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if res.data:
            return {"status": "success", "recommendation": res.data[0]}
        return {"status": "no_data", "recommendation": None}
    except Exception as e:
        logger.error(f"Get last recommendation error: {e}")
        return {"status": "error", "recommendation": None}
