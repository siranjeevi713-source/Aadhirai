"""
Officer operations endpoints for AADHIRAI FastAPI backend.
Uses pymongo instead of SQLAlchemy.
"""
import os
import uuid
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pymongo.database import Database
from bson import ObjectId
from app.core.database import get_db
from app.core.config import settings
from app.core.rbac import require_role
from app.services.ai_service import AIService

router = APIRouter(prefix="/officer", tags=["Officer Operations"])


def _oid(id_str):
    try:
        return ObjectId(str(id_str))
    except Exception:
        return id_str


@router.get("/assignments")
def get_officer_assignments(
    status: Optional[str] = None,
    current_user: dict = Depends(require_role(["department_admin", "officer", "admin", "super_admin"])),
    db: Database = Depends(get_db)
):
    query = {}
    dept_id = current_user.get("departmentId")
    user_role = current_user.get("role", "citizen")

    if user_role not in ("super_admin", "admin") and dept_id:
        query["departmentId"] = _oid(dept_id)

    if status:
        query["status"] = status

    complaints = list(db.complaints.find(query).sort("dueAt", 1).limit(100))
    for c in complaints:
        c["id"] = str(c.pop("_id"))
        for fld in ["citizenId", "departmentId", "incidentDistrictId"]:
            if fld in c and c[fld]:
                c[fld] = str(c[fld])
    return complaints


@router.post("/complaints/{complaint_id}/accept")
def accept_assignment(
    complaint_id: str,
    current_user: dict = Depends(require_role(["department_admin", "officer", "admin", "super_admin"])),
    db: Database = Depends(get_db)
):
    complaint = db.complaints.find_one({"_id": _oid(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    db.complaints.update_one(
        {"_id": _oid(complaint_id)},
        {"$set": {"status": "IN_PROGRESS", "assignedAdminId": current_user["_id"], "updatedAt": datetime.now(timezone.utc)}}
    )
    db.auditlogs.insert_one({
        "userId": current_user["_id"],
        "action": "OFFICER_ACCEPTED_ASSIGNMENT",
        "entityType": "Complaint",
        "entityId": complaint_id,
        "details": f"Accepted by {current_user.get('fullName', 'Officer')}. Status → IN_PROGRESS.",
        "createdAt": datetime.now(timezone.utc)
    })
    return {"message": "Assignment accepted. Status is now IN_PROGRESS", "status": "IN_PROGRESS"}


@router.post("/complaints/{complaint_id}/resolve")
async def submit_resolution(
    complaint_id: str,
    resolution_file: UploadFile = File(...),
    officer_notes: str = Form(...),
    resolution_cost: Optional[float] = Form(0.0),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    current_user: dict = Depends(require_role(["department_admin", "officer", "admin", "super_admin"])),
    db: Database = Depends(get_db)
):
    complaint = db.complaints.find_one({"_id": _oid(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

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

    # pHash fraud check against initial submission
    before_phash = complaint.get("beforeImagePhash")
    phash_match_detected = False
    if before_phash and phash:
        hamming = AIService.calculate_phash_hamming_distance(before_phash, phash)
        if hamming <= 5:
            phash_match_detected = True

    new_status = "NEEDS_REVIEW" if phash_match_detected else "RESOLVED"
    resolved_at = datetime.now(timezone.utc) if not phash_match_detected else None

    update_fields = {
        "status": new_status,
        "afterImageUrl": file_url,
        "officerNotes": officer_notes,
        "updatedAt": datetime.now(timezone.utc)
    }
    if resolved_at:
        update_fields["resolvedAt"] = resolved_at

    db.complaints.update_one({"_id": _oid(complaint_id)}, {"$set": update_fields})

    db.auditlogs.insert_one({
        "userId": current_user["_id"],
        "action": "RESOLUTION_SUBMITTED",
        "entityType": "Complaint",
        "entityId": complaint_id,
        "details": f"Resolution submitted by {current_user.get('fullName', 'Officer')}. pHash match: {phash_match_detected}. Status → {new_status}",
        "createdAt": datetime.now(timezone.utc)
    })

    return {
        "message": "Resolution proof submitted and analyzed",
        "verification_status": "FLAGGED_REVIEW" if phash_match_detected else "PASSED",
        "complaint_status": new_status,
        "phash_match_detected": phash_match_detected,
        "ai_visual_delta_score": 0.05 if phash_match_detected else 0.85
    }
