"""
Role-Based Access Control for AADHIRAI FastAPI backend.
Uses pymongo instead of SQLAlchemy.
"""
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo.database import Database
from app.core.database import get_db
from app.core.security import decode_access_token

security = HTTPBearer(auto_error=False)


def _get_user_by_id(db: Database, user_id: str):
    """Fetch user document from MongoDB by id string."""
    from bson import ObjectId
    try:
        oid = ObjectId(user_id)
    except Exception:
        return None
    return db.users.find_one({"_id": oid, "isActive": True})


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Database = Depends(get_db)
):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload"
        )

    user = _get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account is deactivated"
        )
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Database = Depends(get_db)
):
    if not credentials:
        return None
    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        return None
    return _get_user_by_id(db, payload.get("sub"))


def require_role(allowed_roles: List[str]):
    def role_checker(current_user=Depends(get_current_user)) -> dict:
        user_role = (current_user.get("role") or "citizen").lower()
        # Super admin always has access
        if user_role in ("super_admin", "admin"):
            return current_user
        if user_role not in [r.lower() for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles} roles"
            )
        return current_user
    return role_checker
