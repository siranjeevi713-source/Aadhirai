"""
Evidence verification endpoints for AADHIRAI FastAPI backend.
Uses pymongo instead of SQLAlchemy.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from bson import ObjectId
from app.core.database import get_db
from app.core.rbac import get_current_user, require_role

router = APIRouter(prefix="/verification", tags=["Evidence Verification"])


def _oid(id_str):
    try:
        return ObjectId(str(id_str))
    except Exception:
        return id_str


@router.get("/{complaint_id}")
def get_verification_details(
    complaint_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    complaint = db.complaints.find_one({"_id": _oid(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Look for a review record
    review = db.reviews.find_one({"complaintId": _oid(complaint_id)}) if "reviews" in db.list_collection_names() else None

    return {
        "complaint_id": str(complaint["_id"]),
        "public_reference": complaint.get("ticketNumber", ""),
        "complaint_status": complaint.get("status", ""),
        "verification_status": review.get("status", "UNSUBMITTED") if review else "UNSUBMITTED",
        "ai_visual_delta_score": review.get("aiVisualDeltaScore", 0.0) if review else 0.0,
        "phash_match_detected": review.get("phashMatchDetected", False) if review else False,
        "gps_distance_delta_meters": review.get("gpsDistanceDeltaMeters", 0.0) if review else 0.0,
        "audit_notes": review.get("auditNotes", "") if review else "",
        "reviewer_override_notes": review.get("reviewerOverrideNotes") if review else None,
        "reviewed_at": review.get("reviewedAt") if review else None,
        "before_evidence": {
            "file_url": complaint.get("beforeImageUrl"),
        },
        "after_evidence": {
            "file_url": complaint.get("afterImageUrl"),
        } if complaint.get("afterImageUrl") else None,
    }


@router.post("/{complaint_id}/review")
def review_verification(
    complaint_id: str,
    payload: dict,
    current_user: dict = Depends(require_role(["admin", "super_admin", "reviewer"])),
    db: Database = Depends(get_db)
):
    complaint = db.complaints.find_one({"_id": _oid(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    action = payload.get("action", "").upper()
    justification = payload.get("justification", "")

    if action == "APPROVE":
        new_status = "VERIFIED_RESOLVED"
        resolved_at = datetime.now(timezone.utc)
        db.complaints.update_one(
            {"_id": _oid(complaint_id)},
            {"$set": {
                "status": new_status,
                "resolvedAt": resolved_at,
                "verifiedAt": resolved_at,
                "updatedAt": resolved_at
            }}
        )
    elif action == "REJECT":
        new_status = "REOPENED"
        db.complaints.update_one(
            {"_id": _oid(complaint_id)},
            {"$set": {"status": new_status, "updatedAt": datetime.now(timezone.utc)}}
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid action: must be APPROVE or REJECT")

    # Upsert review record
    db.reviews.update_one(
        {"complaintId": _oid(complaint_id)},
        {"$set": {
            "complaintId": _oid(complaint_id),
            "status": "PASSED" if action == "APPROVE" else "REJECTED",
            "reviewerOverrideNotes": justification,
            "reviewedBy": current_user["_id"],
            "reviewedAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }},
        upsert=True
    )

    db.auditlogs.insert_one({
        "userId": current_user["_id"],
        "action": f"VERIFICATION_REVIEW_{action}",
        "entityType": "Complaint",
        "entityId": complaint_id,
        "details": f"Reviewer {current_user.get('fullName', 'Reviewer')} reviewed verification: {action}. Justification: {justification}",
        "createdAt": datetime.now(timezone.utc)
    })

    return {
        "message": f"Verification review recorded: {action}",
        "complaint_status": new_status,
        "verification_status": "PASSED" if action == "APPROVE" else "REJECTED"
    }
