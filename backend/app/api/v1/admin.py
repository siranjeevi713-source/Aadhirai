from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import require_role
from app.models.models import (
    User, ComplaintCategory, Department, Ward, RoutingRule, SLAPolicy,
    AuditLog, DuplicateLink, Complaint
)
from app.schemas.schemas import (
    CategoryResponse, CategoryCreate, DepartmentResponse, WardResponse
)

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(ComplaintCategory).all()

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    existing = db.query(ComplaintCategory).filter(ComplaintCategory.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category code already exists")

    cat = ComplaintCategory(
        code=payload.code,
        name_en=payload.name_en,
        name_ta=payload.name_ta,
        default_priority=payload.default_priority,
        icon_key=payload.icon_key
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.get("/departments", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.get("/wards", response_model=List[WardResponse])
def list_wards(db: Session = Depends(get_db)):
    return db.query(Ward).order_by(Ward.ward_number.asc()).all()

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs

@router.get("/duplicates")
def get_duplicate_links(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    duplicates = db.query(DuplicateLink).all()
    results = []
    for d in duplicates:
        p = db.query(Complaint).filter(Complaint.id == d.primary_complaint_id).first()
        dup = db.query(Complaint).filter(Complaint.id == d.duplicate_complaint_id).first()
        if p and dup:
            results.append({
                "id": d.id,
                "primary_ref": p.public_reference,
                "primary_title": p.title,
                "duplicate_ref": dup.public_reference,
                "duplicate_title": dup.title,
                "similarity_score": d.similarity_score,
                "is_confirmed": d.is_confirmed,
                "created_at": d.created_at
            })
    return results
