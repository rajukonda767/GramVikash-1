# backend/app/core/config.py
import os
from pydantic_settings import BaseSettings
from typing import List
from dotenv import load_dotenv

# Load local environment variables from .env
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "GramVikas AI Agriculture Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Supabase Credentials (Loaded strictly from environment)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Groq LLM (Loaded strictly from environment)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    
    # Fast2SMS (Loaded strictly from environment)
    FAST2SMS_API_KEY: str = os.getenv("FAST2SMS_API_KEY", "")
    
    # Data.gov.in
    DATA_GOV_IN_API_KEY: str = os.getenv("DATA_GOV_IN_API_KEY", "")
    
    # Models Base Directory
    MODELS_DIR: str = os.getenv(
        "MODELS_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
    
    # CORS Origins (Allow all origins so Vercel & Mobile Apps work smoothly)
    ALLOWED_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
