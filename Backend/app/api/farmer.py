# backend/app/api/farmer.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.schemas.requests import FarmCreateRequest
from app.core.database import get_supabase_admin
from app.core.security import get_current_user
import logging

router = APIRouter(prefix="/farmer", tags=["Farmer & Farm Management"])
logger = logging.getLogger("gramvikas")

@router.post("/farm/setup")
async def setup_farm(req: FarmCreateRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """Creates or updates a farmer's farm profile and active crop in Supabase."""
    supabase = get_supabase_admin()
    user_id = current_user.get("id") if current_user else None

    if not supabase or not user_id:
        # Return success for client state when unauthenticated
        return {
            "status": "success",
            "message": "Farm profile updated locally",
            "data": req.model_dump()
        }

    try:
        # 1. Insert/Update Farm
        f_res = supabase.table("farms").insert({
            "user_id": user_id,
            "farm_name": req.farm_name,
            "area": req.area,
            "area_unit": req.area_unit,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "location_name": req.location_name,
            "soil_type": req.soil_type,
            "irrigation_method": req.irrigation_method
        }).execute()

        farm_id = f_res.data[0]["id"] if f_res.data else None

        # 2. Insert Active Crop if specified
        crop_id = None
        if farm_id and req.has_crop and req.crop_name:
            c_res = supabase.table("crops").insert({
                "farm_id": farm_id,
                "crop_name": req.crop_name,
                "planting_date": req.planting_date or "2026-07-20",
                "status": "active"
            }).execute()
            crop_id = c_res.data[0]["id"] if c_res.data else None

        # 3. Add activity
        supabase.table("farm_activities").insert({
            "user_id": user_id,
            "farm_id": farm_id,
            "crop_id": crop_id,
            "activity_type": "planting" if req.has_crop else "soil_test",
            "description": f"Farm setup: {req.area} acres ({req.crop_name if req.has_crop else 'No crop'})"
        }).execute()

        return {
            "status": "success",
            "farm_id": farm_id,
            "crop_id": crop_id,
            "data": req.model_dump()
        }
    except Exception as e:
        logger.error(f"Error during farm setup: {e}")
        raise HTTPException(status_code=400, detail=str(e))
