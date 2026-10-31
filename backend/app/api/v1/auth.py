from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.rbac import get_current_user
from app.models.models import User, Role
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    # Check phone uniqueness
    existing_phone = db.query(User).filter(User.phone == payload.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is already registered"
        )
    
    # Check email if provided
    if payload.email:
        existing_email = db.query(User).filter(User.email == payload.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already in use"
            )

    citizen_role = db.query(Role).filter(Role.name == "citizen").first()
    if not citizen_role:
        citizen_role = Role(name="citizen", description="Regular citizen")
        db.add(citizen_role)
        db.flush()

    user = User(
        phone=payload.phone,
        email=payload.email,
        full_name=payload.full_name,
        password_hash=get_password_hash(payload.password),
        preferred_language=payload.preferred_language,
        roles=[citizen_role]
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        subject=user.id,
        roles=[r.name for r in user.roles],
        extra_claims={"phone": user.phone, "name": user.full_name}
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    login_id = payload.identifier or payload.phone
    user = None
    if login_id:
        if "@" in login_id:
            user = db.query(User).filter(User.email == login_id.strip()).first()
        else:
            cleaned = login_id.strip()
            user = db.query(User).filter(User.phone == cleaned).first()
            if not user and not cleaned.startswith("+"):
                user = db.query(User).filter(User.phone == f"+91{cleaned}").first()
            if not user and cleaned.startswith("+91"):
                user = db.query(User).filter(User.phone == cleaned[3:]).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )

    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended"
        )

    # Validate expected role if provided by frontend
    user_role_names = [r.name.lower() for r in user.roles]
    if payload.expected_role:
        expected = payload.expected_role.strip().lower()
        if expected not in user_role_names:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Unauthorized role selection: This account does not possess '{payload.expected_role}' privileges."
            )

    # Validate expected department for officer login if provided
    if payload.expected_department_id:
        if "officer" in user_role_names:
            if not user.officer_profile or str(user.officer_profile.department_id) != str(payload.expected_department_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Unauthorized department selection: Account is not assigned to the selected municipal department."
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Department selection is only valid for authorized department officers."
            )

    token = create_access_token(
        subject=user.id,
        roles=[r.name for r in user.roles],
        extra_claims={"phone": user.phone, "name": user.full_name}
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Session invalidated successfully", "status": "ok"}
