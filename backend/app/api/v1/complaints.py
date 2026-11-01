"""
Complaints endpoints for AADHIRAI FastAPI backend.
Uses pymongo instead of SQLAlchemy.
"""
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pymongo.database import Database
from bson import ObjectId
from app.core.database import get_db
from app.core.config import settings
from app.core.rbac import get_current_user
from app.services.ai_service import AIService

router = APIRouter(prefix="/complaints", tags=["Complaints"])


def _oid(id_str):
    try:
        return ObjectId(str(id_str))
    except Exception:
        return id_str


def _format_complaint(c: dict) -> dict:
    out = dict(c)
    out["id"] = str(c["_id"])
    out.pop("_id", None)
    for fld in ["citizenId", "departmentId", "incidentDistrictId", "registeredDistrictId", "assignedAdminId"]:
        if fld in out and out[fld]:
            out[fld] = str(out[fld])
    return out


def _get_dept_name(db: Database, dept_id) -> str:
    if not dept_id:
        return "General Administration"
    try:
        dept = db.departments.find_one({"_id": _oid(dept_id)})
        return dept.get("name", "General Administration") if dept else "General Administration"
    except Exception:
        return "General Administration"


@router.get("")
def list_complaints(
    status: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    user_role = current_user.get("role", "citizen")
    query = {}

    if user_role in ("super_admin", "admin"):
        pass  # see all
    elif user_role == "department_admin":
        dept_id = current_user.get("departmentId")
        if dept_id:
            query["departmentId"] = _oid(dept_id)
    else:
        query["citizenId"] = current_user["_id"]

    if status:
        query["status"] = status

    complaints = list(db.complaints.find(query).sort("createdAt", -1).limit(limit))
    return [_format_complaint(c) for c in complaints]


@router.get("/public/explore")
def explore_public_complaints(
    categoryCode: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 60,
    db: Database = Depends(get_db)
):
    query = {}
    if status:
        query["status"] = status
    if categoryCode:
        query["categoryCode"] = categoryCode
    if q:
        query["$or"] = [
            {"ticketNumber": {"$regex": q, "$options": "i"}},
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]

    complaints = list(db.complaints.find(
        query,
        {"incidentLocation": 1, "ticketNumber": 1, "title": 1,
         "status": 1, "severity": 1, "categoryCode": 1, "incidentAddress": 1,
         "beforeImageUrl": 1, "createdAt": 1, "dueAt": 1, "resolvedAt": 1,
         "departmentId": 1, "_id": 1}
    ).sort("createdAt", -1).limit(limit))

    results = []
    for c in complaints:
        loc = c.get("incidentLocation", {})
        lat = loc.get("lat")
        lon = loc.get("lng")
        results.append({
            "id": str(c["_id"]),
            "public_reference": c.get("ticketNumber", ""),
            "title": c.get("title", ""),
            "status": c.get("status", ""),
            "priority": c.get("severity", "MEDIUM"),
            "category_code": c.get("categoryCode", "OTHER"),
            "category_name_en": (c.get("categoryCode") or "OTHER").replace("_", " ").title(),
            "approximate_lat": round(lat, 3) if lat else None,
            "approximate_lon": round(lon, 3) if lon else None,
            "masked_address": c.get("incidentAddress", ""),
            "department_name": _get_dept_name(db, c.get("departmentId")),
            "photo_url": c.get("beforeImageUrl"),
            "created_at": c.get("createdAt"),
            "due_at": c.get("dueAt"),
            "resolved_at": c.get("resolvedAt"),
        })
    return results


@router.get("/track/{reference}")
def track_public_complaint(reference: str, db: Database = Depends(get_db)):
    c = db.complaints.find_one({"ticketNumber": reference})
    if not c:
        raise HTTPException(status_code=404, detail="Complaint reference not found")

    loc = c.get("incidentLocation", {})
    logs = list(db.auditlogs.find(
        {"entityId": str(c["_id"])},
        {"action": 1, "details": 1, "createdAt": 1, "_id": 0}
    ).sort("createdAt", 1))

    return {
        "id": str(c["_id"]),
        "public_reference": c.get("ticketNumber", ""),
        "title": c.get("title", ""),
        "status": c.get("status", ""),
        "priority": c.get("severity", "MEDIUM"),
        "category_name_en": (c.get("categoryCode") or "OTHER").replace("_", " ").title(),
        "department_name": _get_dept_name(db, c.get("departmentId")),
        "approximate_lat": round(loc.get("lat", 0), 3),
        "approximate_lon": round(loc.get("lng", 0), 3),
        "address": c.get("incidentAddress", ""),
        "before_photo": c.get("beforeImageUrl"),
        "after_photo": c.get("afterImageUrl"),
        "due_at": c.get("dueAt"),
        "created_at": c.get("createdAt"),
        "resolved_at": c.get("resolvedAt"),
        "timeline": logs,
        "has_proof": c.get("status") in ("RESOLVED", "VERIFIED_RESOLVED", "CLOSED")
    }


@router.get("/{complaint_id}")
def get_complaint_details(
    complaint_id: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    try:
        complaint = db.complaints.find_one({"_id": _oid(complaint_id)})
    except Exception:
        complaint = db.complaints.find_one({"ticketNumber": complaint_id})

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    user_role = current_user.get("role", "citizen")
    if user_role not in ("super_admin", "admin", "department_admin", "reviewer"):
        if str(complaint.get("citizenId")) != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Unauthorized to view this complaint")

    return _format_complaint(complaint)
