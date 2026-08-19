# backend/app/api/market.py
from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.requests import ProfitCalculateRequest
from app.services.market_service import market_service
import logging

router = APIRouter(prefix="/market", tags=["Market & Profit"])
logger = logging.getLogger("gramvikas")

@router.get("/prices")
async def get_mandi_prices(state: str = "Andhra Pradesh", district: str = "NTR District"):
    """Fetches real APMC Mandi commodity rates."""
    return {
        "status": "success",
        "prices": market_service.get_mandi_prices(state=state, district=district)
    }

@router.post("/profit/calculate")
async def calculate_profit(req: ProfitCalculateRequest):
    """Calculates expected gross revenue, total inputs cost, and net agricultural profit."""
    try:
        res = market_service.calculate_profit(
            crop=req.crop,
            area_acres=req.area_acres,
            yield_tonnes_per_acre=req.yield_tonnes_per_acre,
            market_price_per_quintal=req.market_price_per_quintal,
            seed_cost=req.seed_cost,
            fertilizer_cost=req.fertilizer_cost,
            pesticide_cost=req.pesticide_cost,
            labor_cost=req.labor_cost,
            irrigation_cost=req.irrigation_cost,
            transport_cost=req.transport_cost,
            language=req.language
        )
        return res
    except Exception as e:
        logger.error(f"Profit calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
