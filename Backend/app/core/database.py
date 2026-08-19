# backend/app/core/database.py
import logging
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("gramvikas")

try:
    # Service role client for trusted server-side operations
    supabase_admin: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    # Anon client for public requests
    supabase_anon: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY
    )
    logger.info("✅ Supabase client initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize Supabase client: {e}")
    supabase_admin = None
    supabase_anon = None

def get_supabase_admin() -> Client:
    return supabase_admin

def get_supabase_anon() -> Client:
    return supabase_anon
