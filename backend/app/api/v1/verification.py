from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user, require_role
from app.models.models import (
    User, Complaint, VerificationRequest, ComplaintEvidence, AuditLog
)
from app.schemas.schemas import VerificationReviewRequest, VerificationResponse
from app.services.verification_service import VerificationService

router = APIRouter(prefix="/verification", tags=["Evidence Verification"])

@router.get("/{complaint_id}")
def get_verification_details(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    v_req = db.query(VerificationRequest).filter(VerificationRequest.complaint_id == complaint_id).first()
    
    before_ev = db.query(ComplaintEvidence).filter(
        ComplaintEvidence.complaint_id == complaint_id,
        ComplaintEvidence.phase == "INITIAL_SUBMISSION"
    ).first()

    after_ev = db.query(ComplaintEvidence).filter(
        ComplaintEvidence.complaint_id == complaint_id,
        ComplaintEvidence.phase == "RESOLUTION_PROOF"
    ).first()

    return {
        "complaint_id": complaint.id,
        "public_reference": complaint.public_reference,
        "complaint_status": complaint.status,
        "verification_status": v_req.status if v_req else "UNSUBMITTED",
        "ai_visual_delta_score": v_req.ai_visual_delta_score if v_req else 0.0,
        "phash_match_detected": v_req.phash_match_detected if v_req else False,
        "gps_distance_delta_meters": v_req.gps_distance_delta_meters if v_req else 0.0,
        "audit_notes": v_req.audit_notes if v_req else "",
        "reviewer_override_notes": v_req.reviewer_override_notes if v_req else None,
        "reviewed_at": v_req.reviewed_at if v_req else None,
        "before_evidence": {
            "file_url": before_ev.file_url if before_ev else None,
            "perceptual_hash": before_ev.perceptual_hash if before_ev else None
        } if before_ev else None,
        "after_evidence": {
            "file_url": after_ev.file_url if after_ev else None,
            "perceptual_hash": after_ev.perceptual_hash if after_ev else None
        } if after_ev else None
    }

@router.post("/{complaint_id}/review")
def review_verification(
    complaint_id: str,
    payload: VerificationReviewRequest,
    current_user: User = Depends(require_role(["admin", "reviewer"])),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    v_req = db.query(VerificationRequest).filter(VerificationRequest.complaint_id == complaint_id).first()
    if not v_req:
        raise HTTPException(status_code=400, detail="No verification request submitted for this complaint")

    before_ev = db.query(ComplaintEvidence).filter(
        ComplaintEvidence.complaint_id == complaint_id,
        ComplaintEvidence.phase == "INITIAL_SUBMISSION"
    ).first()

    after_ev = db.query(ComplaintEvidence).filter(
        ComplaintEvidence.complaint_id == complaint_id,
        ComplaintEvidence.phase == "RESOLUTION_PROOF"
    ).first()

    if payload.action == "APPROVE":
        v_req.status = "PASSED"
        complaint.status = "VERIFIED_RESOLVED"
        complaint.resolved_at = datetime.now(timezone.utc)
        if after_ev:
            VerificationService.publish_proof_record(db, complaint, before_ev, after_ev)
    elif payload.action == "REJECT":
        v_req.status = "REJECTED"
        complaint.status = "REOPENED"
    else:
        raise HTTPException(status_code=400, detail="Invalid action: must be APPROVE or REJECT")

    v_req.reviewer_override_notes = payload.justification
    v_req.reviewed_by = current_user.id
    v_req.reviewed_at = datetime.now(timezone.utc)

    db.add(AuditLog(
        user_id=current_user.id,
        action=f"VERIFICATION_REVIEW_{payload.action}",
        entity_type="Complaint",
        entity_id=complaint.id,
        details=f"Admin {current_user.full_name} reviewed verification: {payload.action}. Justification: {payload.justification}"
    ))

    db.commit()
    return {
        "message": f"Verification review recorded: {payload.action}",
        "complaint_status": complaint.status,
        "verification_status": v_req.status
    }
