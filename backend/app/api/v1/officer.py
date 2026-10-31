import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.rbac import require_role
from app.models.models import (
    User, Complaint, Officer, WorkOrder, ComplaintEvidence, AuditLog
)
from app.schemas.schemas import (
    ComplaintListItem, WorkOrderResponse, CreateWorkOrderRequest,
    ComplaintDetailResponse
)
from app.services.ai_service import AIService
from app.services.verification_service import VerificationService

router = APIRouter(prefix="/officer", tags=["Officer Operations"])

@router.get("/assignments", response_model=List[ComplaintListItem])
def get_officer_assignments(
    status: Optional[str] = None,
    current_user: User = Depends(require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    
    if current_user.officer_profile:
        # Filter by officer's department or direct assignment
        dept_id = current_user.officer_profile.department_id
        query = query.filter(Complaint.assigned_department_id == dept_id)
    
    if status:
        query = query.filter(Complaint.status == status)

    complaints = query.order_by(Complaint.due_at.asc()).all()
    items = []
    for c in complaints:
        items.append(ComplaintListItem(
            id=c.id,
            public_reference=c.public_reference,
            title=c.title,
            category=c.category,
            status=c.status,
            priority=c.priority,
            latitude=c.latitude,
            longitude=c.longitude,
            address_text=c.address_text,
            ward_name=c.ward.name_ta if c.ward else None,
            department_name=c.assigned_department.name_ta if c.assigned_department else None,
            due_at=c.due_at,
            created_at=c.created_at
        ))
    return items

@router.post("/complaints/{complaint_id}/accept")
def accept_assignment(
    complaint_id: str,
    current_user: User = Depends(require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.status = "IN_PROGRESS"
    if current_user.officer_profile:
        complaint.assigned_officer_id = current_user.officer_profile.id

    db.add(AuditLog(
        user_id=current_user.id,
        action="OFFICER_ACCEPTED_ASSIGNMENT",
        entity_type="Complaint",
        entity_id=complaint.id,
        details=f"Accepted by {current_user.full_name}. Status changed to IN_PROGRESS."
    ))

    db.commit()
    return {"message": "Assignment accepted. Status is now IN_PROGRESS", "status": "IN_PROGRESS"}

@router.post("/complaints/{complaint_id}/work-order", response_model=WorkOrderResponse)
def create_work_order(
    complaint_id: str,
    payload: CreateWorkOrderRequest,
    current_user: User = Depends(require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    officer_id = current_user.officer_profile.id if current_user.officer_profile else None
    if not officer_id:
        officer = db.query(Officer).first()
        officer_id = officer.id if officer else None

    order_count = db.query(WorkOrder).count() + 1
    order_num = f"WO-MSR-{order_count:04d}"

    work_order = WorkOrder(
        complaint_id=complaint.id,
        officer_id=officer_id,
        order_number=order_num,
        title=payload.title,
        action_plan=payload.action_plan,
        estimated_cost=payload.estimated_cost,
        status="IN_PROGRESS"
    )
    db.add(work_order)

    db.add(AuditLog(
        user_id=current_user.id,
        action="WORK_ORDER_CREATED",
        entity_type="Complaint",
        entity_id=complaint.id,
        details=f"Work Order {order_num} created with budget estimate Rs. {payload.estimated_cost}"
    ))

    db.commit()
    db.refresh(work_order)
    return work_order

@router.post("/complaints/{complaint_id}/resolve")
async def submit_resolution(
    complaint_id: str,
    resolution_file: UploadFile = File(...),
    officer_notes: str = Form(...),
    resolution_cost: Optional[float] = Form(0.0),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    current_user: User = Depends(require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Read and store resolution proof
    file_bytes = await resolution_file.read()
    file_size = len(file_bytes)
    mime_type = resolution_file.content_type or "image/jpeg"
    phash = AIService.compute_phash(file_bytes)

    ext = os.path.splitext(resolution_file.filename or ".jpg")[1]
    filename = f"resolution_{uuid.uuid4()}{ext}"
    filepath = settings.STORAGE_DIR / filename
    with open(filepath, "wb") as f:
        f.write(file_bytes)
    
    file_url = f"/storage/{filename}"

    resolution_ev = ComplaintEvidence(
        complaint_id=complaint.id,
        phase="RESOLUTION_PROOF",
        media_type="IMAGE",
        file_path=str(filepath),
        file_url=file_url,
        mime_type=mime_type,
        file_size_bytes=file_size,
        perceptual_hash=phash,
        exif_lat=latitude or complaint.latitude,
        exif_lon=longitude or complaint.longitude
    )
    db.add(resolution_ev)
    db.flush()

    # Pass through independent verification pipeline
    v_req = VerificationService.evaluate_resolution_evidence(db, complaint, resolution_ev)

    db.add(AuditLog(
        user_id=current_user.id,
        action="RESOLUTION_SUBMITTED",
        entity_type="Complaint",
        entity_id=complaint.id,
        details=f"Resolution proof submitted by {current_user.full_name}. Result: {v_req.status}"
    ))
    db.commit()

    return {
        "message": "Resolution proof submitted and analyzed by verification pipeline",
        "verification_status": v_req.status,
        "complaint_status": complaint.status,
        "phash_match_detected": v_req.phash_match_detected,
        "ai_visual_delta_score": v_req.ai_visual_delta_score
    }
