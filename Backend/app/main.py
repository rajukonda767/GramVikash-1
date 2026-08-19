# backend/app/main.py
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.ml.model_loader import model_manager

# Import API Routers
from app.api.auth import router as auth_router
from app.api.farmer import router as farmer_router
from app.api.crop_recommendation import router as crop_router
from app.api.disease_detection import router as disease_router
from app.api.irrigation import router as irrigation_router
from app.api.yield_prediction import router as yield_router
from app.api.market import router as market_router
from app.api.emergency import router as emergency_router
from app.api.assistant import router as assistant_router
from app.api.dashboard import router as dashboard_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("gramvikas")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Application Startup: Load ML models into memory
    logger.info("==================================================")
    logger.info("🌱 GramVikas AI Agriculture Platform Starting Up...")
    logger.info(f"Models Directory: {settings.MODELS_DIR}")
    
    success = model_manager.load_all_models(settings.MODELS_DIR)
    if success:
        logger.info("🚀 All ML models loaded and ready in memory!")
    else:
        logger.warning(f"⚠️ Some models had load warnings: {model_manager.load_errors}")
    logger.info("==================================================")
    
    yield
    
    # Application Shutdown
    logger.info("🛑 GramVikas AI Agriculture Platform Shutting Down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multilingual Voice-First AI Digital Agriculture Platform for Indian Farmers",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An internal server error occurred. Please try again.",
            "path": request.url.path
        }
    )

# Health Check Endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "models_loaded": model_manager.models_loaded,
        "crop_model": model_manager.crop_model is not None,
        "disease_model": model_manager.disease_model is not None,
        "yield_model": model_manager.yield_model is not None,
        "fertilizer_model": model_manager.fertilizer_model is not None
    }

# Mount Routers under both /api prefix AND root prefix to guarantee zero 404s
routers = [
    auth_router,
    farmer_router,
    crop_router,
    disease_router,
    irrigation_router,
    yield_router,
    market_router,
    emergency_router,
    assistant_router,
    dashboard_router
]

for r in routers:
    app.include_router(r, prefix="/api")
    app.include_router(r)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
