# backend/app/core/security.py
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.core.database import get_supabase_admin
import logging

logger = logging.getLogger("gramvikas")
security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """
    Extracts and verifies JWT token using Supabase Auth.
    If no token is provided, returns None (optional auth) or raises 401 if required.
    """
    if not credentials:
        return None

    token = credentials.credentials
    supabase = get_supabase_admin()
    if not supabase:
        return None

    try:
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return {
                "id": user_response.user.id,
                "email": user_response.user.email,
                "phone": user_response.user.phone,
                "user_metadata": user_response.user.user_metadata or {}
            }
    except Exception as e:
        logger.warning(f"Invalid auth token: {e}")
        return None

    return None

async def require_current_user(current_user: Optional[dict] = Depends(get_current_user)) -> dict:
    """Dependency that strictly requires an authenticated Supabase user."""
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please login with valid credentials."
        )
    return current_user
