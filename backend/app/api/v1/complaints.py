import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.rbac import get_current_user
from app.models.models import (
    User, Complaint, ComplaintCategory, ComplaintEvidence, AIPrediction,
    ComplaintFeedback, AuditLog
)
from app.schemas.schemas import (
    ComplaintListItem, ComplaintDetailResponse, CategoryResponse,
    FeedbackRequest, DisputeRequest
)
from app.services.ai_service import AIService
from app.services.routing_service import RoutingService
from app.services.sla_service import SLAService

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def generate_public_reference(db: Session) -> str:
    count = db.query(Complaint).count() + 1
    return f"ADH-2026-MSR-{count:04d}"

@router.post("", response_model=ComplaintDetailResponse, status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    title: str = Form(...),
    description: str = Form(...),
    category_id: Optional[str] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address_text: Optional[str] = Form(None),
    landmark: Optional[str] = Form(None),
    language: str = Form("ta"),
    priority: str = Form("MEDIUM"),
    evidence_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Process Evidence File if attached
    phash = None
    file_bytes = None
    stored_path = ""
    file_url = ""
    mime_type = "image/jpeg"
    file_size = 0

    if evidence_file:
        file_bytes = await evidence_file.read()
        file_size = len(file_bytes)
        mime_type = evidence_file.content_type or "image/jpeg"
        phash = AIService.compute_phash(file_bytes)
        
        # Save file to disk
        ext = os.path.splitext(evidence_file.filename or ".jpg")[1]
        filename = f"{uuid.uuid4()}{ext}"
        filepath = settings.STORAGE_DIR / filename
        with open(filepath, "wb") as f:
            f.write(file_bytes)
        stored_path = str(filepath)
        file_url = f"/storage/{filename}"

    # 2. Hybrid AI Classification
    ai_result = AIService.classify_grievance(description, file_bytes)
    
    # Category resolution: citizen selection takes precedence, fallback to AI suggestion
    resolved_category = None
    if category_id:
        resolved_category = db.query(ComplaintCategory).filter(ComplaintCategory.id == category_id).first()
    
    if not resolved_category:
        suggested_code = ai_result["suggested_category"]
        resolved_category = db.query(ComplaintCategory).filter(ComplaintCategory.code == suggested_code).first()
    
    if not resolved_category:
        resolved_category = db.query(ComplaintCategory).filter(ComplaintCategory.code == "other_civic").first()

    # 3. Spatial Ward Matching & Deterministic Routing
    matched_ward = RoutingService.match_ward(db, latitude, longitude)
    matched_dept = RoutingService.determine_department(db, resolved_category.id)
    assigned_officer = None
    if matched_dept:
        assigned_officer = RoutingService.assign_officer(
            db, matched_dept.id, matched_ward.id if matched_ward else None
        )

    # 4. SLA Deadline Calculation
    due_date = SLAService.calculate_due_date(db, resolved_category.id, priority)

    # 5. Create Complaint Record
    public_ref = generate_public_reference(db)
    complaint = Complaint(
        public_reference=public_ref,
        citizen_id=current_user.id,
        category_id=resolved_category.id,
        title=title,
        description=description,
        language=language,
        priority=priority,
        status="ASSIGNED" if assigned_officer else "SUBMITTED",
        latitude=latitude,
        longitude=longitude,
        address_text=address_text or (matched_ward.name_ta if matched_ward else "முசிறி நகராட்சி"),
        landmark=landmark,
        ward_id=matched_ward.id if matched_ward else None,
        assigned_department_id=matched_dept.id if matched_dept else None,
        assigned_officer_id=assigned_officer.id if assigned_officer else None,
        ai_suggested_category=ai_result["suggested_category"],
        ai_confidence=ai_result["confidence"],
        requires_human_review=ai_result["requires_human_review"],
        due_at=due_date
    )
    db.add(complaint)
    db.flush()

    # Save evidence record
    if file_url:
        evidence = ComplaintEvidence(
            complaint_id=complaint.id,
            phase="INITIAL_SUBMISSION",
            media_type="IMAGE",
            file_path=stored_path,
            file_url=file_url,
            mime_type=mime_type,
            file_size_bytes=file_size,
            perceptual_hash=phash,
            exif_lat=latitude,
            exif_lon=longitude
        )
        db.add(evidence)

    # Save AI Prediction record
    ai_pred = AIPrediction(
        complaint_id=complaint.id,
        model_name="Aadhirai-Hybrid-Vision-v1",
        suggested_category=ai_result["suggested_category"],
        detected_objects=str(ai_result["detected_objects"]),
        confidence=ai_result["confidence"],
        reason=ai_result["reason"],
        requires_human_review=ai_result["requires_human_review"]
    )
    db.add(ai_pred)

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="COMPLAINT_SUBMITTED",
        entity_type="Complaint",
        entity_id=complaint.id,
        details=f"Reference: {public_ref}, Assigned Dept: {matched_dept.code if matched_dept else 'None'}"
    ))

    db.commit()
    db.refresh(complaint)
    return format_complaint_detail(complaint)

@router.get("", response_model=List[ComplaintListItem])
def list_complaints(
    status: Optional[str] = None,
    category_id: Optional[str] = None,
    ward_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_roles = [r.name for r in current_user.roles]
    query = db.query(Complaint)

    # Role Scoping
    if "admin" in user_roles:
        pass # Admin sees all
    elif "officer" in user_roles and current_user.officer_profile:
        # Officer sees department complaints
        dept_id = current_user.officer_profile.department_id
        query = query.filter(Complaint.assigned_department_id == dept_id)
    else:
        # Citizen sees only own complaints
        query = query.filter(Complaint.citizen_id == current_user.id)

    if status:
        query = query.filter(Complaint.status == status)
    if category_id:
        query = query.filter(Complaint.category_id == category_id)
    if ward_id:
        query = query.filter(Complaint.ward_id == ward_id)

    complaints = query.order_by(Complaint.created_at.desc()).all()
    
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

@router.get("/public/explore")
def explore_public_complaints(
    category_id: Optional[str] = None,
    ward_id: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 60,
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    if status:
        query = query.filter(Complaint.status == status)
    if category_id:
        query = query.filter(Complaint.category_id == category_id)
    if ward_id:
        query = query.filter(Complaint.ward_id == ward_id)
    if q:
        search = f"%{q.strip()}%"
        query = query.filter(
            (Complaint.public_reference.ilike(search)) |
            (Complaint.title.ilike(search)) |
            (Complaint.description.ilike(search))
        )
    
    complaints = query.order_by(Complaint.created_at.desc()).limit(limit).all()
    results = []
    for c in complaints:
        approx_lat = round(c.latitude, 3) if c.latitude else 10.941
        approx_lon = round(c.longitude, 3) if c.longitude else 78.448
        masked_address = c.ward.name_ta if c.ward else (c.address_text or "முசிறி நகராட்சி")
        
        first_ev = None
        if c.evidence:
            first_ev = c.evidence[0].file_url
            
        results.append({
            "id": c.id,
            "public_reference": c.public_reference,
            "title": c.title,
            "status": c.status,
            "priority": c.priority,
            "category_code": c.category.code if c.category else "other_civic",
            "category_name_ta": c.category.name_ta if c.category else "பொதுப் பிரச்சனை",
            "category_name_en": c.category.name_en if c.category else "Civic Issue",
            "ward_number": c.ward.ward_number if c.ward else None,
            "ward_name": c.ward.name_ta if c.ward else "முசிறி",
            "department_name": c.assigned_department.name_ta if c.assigned_department else "பொது நிர்வாகம்",
            "approximate_lat": approx_lat,
            "approximate_lon": approx_lon,
            "masked_address": masked_address,
            "photo_url": first_ev,
            "created_at": c.created_at,
            "due_at": c.due_at,
            "resolved_at": c.resolved_at
        })
    return results

@router.get("/track/{reference}")
def track_public_complaint(
    reference: str,
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.public_reference == reference).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint reference not found")
    
    logs = db.query(AuditLog).filter(
        AuditLog.entity_id == c.id
    ).order_by(AuditLog.created_at.asc()).all()
    
    timeline = [
        {
            "action": log.action,
            "details": log.details,
            "timestamp": log.created_at
        }
        for log in logs
    ]
    
    before_ev = None
    after_ev = None
    for ev in c.evidence:
        if ev.phase == "INITIAL_SUBMISSION" and not before_ev:
            before_ev = ev.file_url
        elif ev.phase == "RESOLUTION_PROOF" and not after_ev:
            after_ev = ev.file_url

    return {
        "id": c.id,
        "public_reference": c.public_reference,
        "title": c.title,
        "status": c.status,
        "priority": c.priority,
        "category_name_ta": c.category.name_ta if c.category else "பொதுப் பிரச்சனை",
        "category_name_en": c.category.name_en if c.category else "Civic Issue",
        "ward_name": c.ward.name_ta if c.ward else "முசிறி",
        "department_name": c.assigned_department.name_ta if c.assigned_department else "பொது நிர்வாகம்",
        "approximate_lat": round(c.latitude, 3) if c.latitude else 10.941,
        "approximate_lon": round(c.longitude, 3) if c.longitude else 78.448,
        "address": c.ward.name_ta if c.ward else "முசிறி நகராட்சி",
        "before_photo": before_ev,
        "after_photo": after_ev,
        "due_at": c.due_at,
        "created_at": c.created_at,
        "resolved_at": c.resolved_at,
        "timeline": timeline,
        "has_proof": c.status == "VERIFIED_RESOLVED"
    }

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
def get_complaint_details(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    user_roles = [r.name for r in current_user.roles]
    if "admin" not in user_roles and "officer" not in user_roles and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this complaint")

    return format_complaint_detail(complaint)

@router.get("/{complaint_id}/history")
def get_complaint_history(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    logs = db.query(AuditLog).filter(
        AuditLog.entity_id == complaint_id
    ).order_by(AuditLog.created_at.asc()).all()
    
    timeline = [
        {
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "timestamp": log.created_at
        }
        for log in logs
    ]
    return timeline

@router.post("/{complaint_id}/feedback")
def submit_feedback(
    complaint_id: str,
    payload: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only complaint submitter can provide feedback")

    feedback = db.query(ComplaintFeedback).filter(ComplaintFeedback.complaint_id == complaint.id).first()
    if not feedback:
        feedback = ComplaintFeedback(
            complaint_id=complaint.id,
            citizen_id=current_user.id,
            rating=payload.rating,
            comments=payload.comments
        )
        db.add(feedback)
    else:
        feedback.rating = payload.rating
        feedback.comments = payload.comments

    db.add(AuditLog(
        user_id=current_user.id,
        action="CITIZEN_FEEDBACK_SUBMITTED",
        entity_type="Complaint",
        entity_id=complaint.id,
        details=f"Rating: {payload.rating}/5 stars. Comments: {payload.comments or ''}"
    ))

    db.commit()
    return {"message": "Feedback submitted successfully"}

@router.post("/{complaint_id}/dispute")
def dispute_resolution(
    complaint_id: str,
    payload: DisputeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only complaint submitter can dispute resolution")

    # Set status to DISPUTED and trigger escalation
    complaint.status = "DISPUTED"
    
    feedback = db.query(ComplaintFeedback).filter(ComplaintFeedback.complaint_id == complaint.id).first()
    if not feedback:
        feedback = ComplaintFeedback(
            complaint_id=complaint.id,
            citizen_id=current_user.id,
            rating=1,
            is_disputed=True,
            dispute_reason=payload.reason
        )
        db.add(feedback)
    else:
        feedback.is_disputed = True
        feedback.dispute_reason = payload.reason

    # Trigger Escalation
    SLAService.check_and_escalate(db, complaint, reason="CITIZEN_DISPUTE")

    db.commit()
    return {"message": "Resolution disputed. Complaint has been escalated for administrative review."}

def format_complaint_detail(c: Complaint) -> ComplaintDetailResponse:
    assigned_name = c.assigned_officer.user.full_name if c.assigned_officer and c.assigned_officer.user else None
    return ComplaintDetailResponse(
        id=c.id,
        public_reference=c.public_reference,
        title=c.title,
        description=c.description,
        language=c.language,
        priority=c.priority,
        status=c.status,
        latitude=c.latitude,
        longitude=c.longitude,
        address_text=c.address_text,
        landmark=c.landmark,
        category=c.category,
        ward=c.ward,
        assigned_department=c.assigned_department,
        assigned_officer_name=assigned_name,
        ai_suggested_category=c.ai_suggested_category,
        ai_confidence=c.ai_confidence or 0.0,
        requires_human_review=c.requires_human_review,
        due_at=c.due_at,
        resolved_at=c.resolved_at,
        created_at=c.created_at,
        updated_at=c.updated_at,
        evidence=c.evidence,
        work_orders=c.work_orders,
        verification=c.verification_request,
        feedback=c.feedback
    )
