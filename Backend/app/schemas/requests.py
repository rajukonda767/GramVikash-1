# backend/app/schemas/requests.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Auth Schemas
class UserSignupRequest(BaseModel):
    name: str = Field(..., example="Ramesh Kumar")
    email: Optional[str] = None
    phone: Optional[str] = "9390616956"
    password: str = Field(..., min_length=6)
    language: str = "te"

class UserLoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

# Farm Onboarding Schemas
class FarmCreateRequest(BaseModel):
    farm_name: str = "My Farm"
    area: float = 3.5
    area_unit: str = "acres"
    latitude: float = 16.5062
    longitude: float = 80.6480
    location_name: str = "Vijayawada, Andhra Pradesh"
    soil_type: str = "Alluvial Soil"
    irrigation_method: str = "Drip & Borewell"
    has_crop: bool = True
    crop_name: Optional[str] = "Paddy"
    planting_date: Optional[str] = None

# Crop Recommendation Schema
class CropRecommendRequest(BaseModel):
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    ph: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    latitude: float = 16.5062
    longitude: float = 80.6480
    location_name: str = "Vijayawada, Andhra Pradesh"
    farmer_questions: Optional[Dict[str, Any]] = None
    language: str = "te"

# Yield Prediction Schema
class YieldPredictRequest(BaseModel):
    crop: str = "Rice"
    area_acres: float = 3.5
    season: str = "Kharif"
    state: str = "Andhra Pradesh"
    rainfall_mm: float = 850.0
    fertilizer_kg: float = 120.0
    pesticide_kg: float = 2.5
    language: str = "te"

# Irrigation Calculation Schema
class IrrigationRequest(BaseModel):
    crop: str = "Paddy"
    growth_stage: str = "Vegetative Stage"
    soil_moisture: float = 45.0
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    latitude: float = 16.5062
    longitude: float = 80.6480
    language: str = "te"

class IrrigationLogRequest(BaseModel):
    crop_id: Optional[str] = None
    farm_id: Optional[str] = None
    amount_liters: float = 20.0
    method: str = "Drip"

# Market Profit Schema
class ProfitCalculateRequest(BaseModel):
    crop: str = "Paddy"
    area_acres: float = 3.5
    yield_tonnes_per_acre: float = 3.4
    market_price_per_quintal: float = 2320.0
    seed_cost: float = 3500.0
    fertilizer_cost: float = 8000.0
    pesticide_cost: float = 4500.0
    labor_cost: float = 12000.0
    irrigation_cost: float = 3000.0
    transport_cost: float = 2500.0
    language: str = "te"

# Emergency SOS Schema
class EmergencySOSRequest(BaseModel):
    emergency_type: str = "snake_bite"
    latitude: float = 16.5062
    longitude: float = 80.6480
    location_name: str = "Vijayawada, Andhra Pradesh"
    farmer_name: str = "Raju"
    farmer_phone: str = "9390616956"
    language: str = "te"

# AI Chat Schema with Multi-Turn Conversation History
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "session_001"
    language: str = "te"
    farmer_context: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, str]]] = None
