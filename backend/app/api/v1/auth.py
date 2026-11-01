"""
Authentication endpoints for AADHIRAI FastAPI backend.
Uses pymongo instead of SQLAlchemy.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from bson import ObjectId
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.rbac import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _user_to_response(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "fullName": user.get("fullName") or user.get("name", ""),
        "role": user.get("role", "citizen"),
        "isActive": user.get("isActive", True),
        "districtId": str(user["districtId"]) if user.get("districtId") else None,
        "departmentId": str(user["departmentId"]) if user.get("departmentId") else None,
    }


@router.post("/login")
def login(payload: dict, db: Database = Depends(get_db)):
    """Login with email/phone + password."""
    login_id = payload.get("identifier") or payload.get("email") or payload.get("phone", "")

    user = None
    if "@" in login_id:
        user = db.users.find_one({"email": login_id.strip()})
    else:
        cleaned = login_id.strip()
        user = db.users.find_one({"phone": cleaned})
        if not user and not cleaned.startswith("+"):
            user = db.users.find_one({"phone": f"+91{cleaned}"})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Try passwordHash (MERN Express format) or password_hash (legacy)
    stored_hash = user.get("passwordHash") or user.get("password_hash", "")
    plain = payload.get("password", "")

    if not verify_password(plain, stored_hash):
        # Also try bcrypt if available (MERN backend uses bcrypt)
        try:
            import bcrypt
            if not bcrypt.checkpw(plain.encode(), stored_hash.encode()):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
        except ImportError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

    if not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended"
        )

    user_id = str(user["_id"])
    user_role = user.get("role", "citizen")

    token = create_access_token(
        subject=user_id,
        roles=[user_role],
        extra_claims={
            "email": user.get("email", ""),
            "name": user.get("fullName") or user.get("name", "")
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _user_to_response(user)
    }


@router.get("/me")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    return _user_to_response(current_user)


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Session invalidated successfully", "status": "ok"}
