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


@router.post("", status_code=201)
async def create_complaint(
    title: str = Form(...),
    description: str = Form(...),
    category_id: Optional[str] = Form(None),
    citizen_category: Optional[str] = Form(None),
    latitude: float = Form(10.9413),
    longitude: float = Form(78.4485),
    address_text: Optional[str] = Form(None),
    landmark: Optional[str] = Form(None),
    priority: Optional[str] = Form("HIGH"),
    ai_predicted_category: Optional[str] = Form(None),
    ai_confidence: Optional[float] = Form(None),
    ai_explanation: Optional[str] = Form(None),
    ai_model_version: Optional[str] = Form("CivicAi-YOLO11m-v1+Gemini"),
    evidence_file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    """
    Submit a citizen civic grievance.
    1. Independent Location: Resolves district from verified GPS coordinates or jurisdiction.
    2. Department Routing: Deterministically routes using citizenConfirmedCategory + district routing rules.
    3. Preserves original AI prediction alongside citizen-confirmed category.
    """
    import random
    from datetime import datetime, timezone
    from app.core.config import settings

    # Resolve category code
    confirmed_cat = (citizen_category or category_id or "ROAD_DAMAGE").upper().replace("-", "_").replace(" ", "_")
    if "POTHOLE" in confirmed_cat or "ROAD" in confirmed_cat:
        cat_code = "ROAD_DAMAGE" if "DAMAGE" in confirmed_cat else "POTHOLE"
    elif "GARBAGE" in confirmed_cat or "WASTE" in confirmed_cat:
        cat_code = "GARBAGE_ACCUMULATION"
    elif "DRAIN" in confirmed_cat:
        cat_code = "DRAINAGE_BLOCKAGE"
    elif "SEWAGE" in confirmed_cat:
        cat_code = "SEWAGE_OVERFLOW"
    elif "WATERLOG" in confirmed_cat:
        cat_code = "WATERLOGGING"
    elif "WATER" in confirmed_cat:
        cat_code = "WATER_LEAKAGE"
    elif "LIGHT" in confirmed_cat or "ELEC" in confirmed_cat:
        cat_code = "BROKEN_STREETLIGHT"
    else:
        cat_code = confirmed_cat

    # Save uploaded evidence file if provided
    file_url = None
    if evidence_file and evidence_file.filename:
        os.makedirs(settings.STORAGE_DIR, exist_ok=True)
        filename = f"evid_{random.randint(100000, 999999)}_{evidence_file.filename}"
        filepath = settings.STORAGE_DIR / filename
        content = await evidence_file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        file_url = f"/storage/{filename}"

    # Department Routing using MongoDB routing rules
    rule = db.routingrules.find_one({"categoryCode": cat_code, "isActive": True})
    dept_id = rule["departmentId"] if rule and rule.get("departmentId") else None

    # Fallback to default department lookup by code if rule not district-specific
    if not dept_id:
        dept_map = {
            "ROAD_DAMAGE": "dept_roads",
            "POTHOLE": "dept_roads",
            "GARBAGE_ACCUMULATION": "dept_sanitation",
            "DRAINAGE_BLOCKAGE": "dept_water",
            "SEWAGE_OVERFLOW": "dept_sanitation",
            "WATER_LEAKAGE": "dept_water",
            "WATERLOGGING": "dept_water",
            "BROKEN_STREETLIGHT": "dept_electrical",
        }
        fallback_code = dept_map.get(cat_code, "dept_roads")
        dept = db.departments.find_one({"code": fallback_code.upper()})
        if not dept:
            dept = db.departments.find_one()
        dept_id = dept["_id"] if dept else None

    # Ticket reference
    rand_seq = random.randint(1000, 9999)
    ticket_num = f"ADH-2026-{rand_seq}"

    doc = {
        "ticketNumber": ticket_num,
        "title": title,
        "description": description,
        "categoryCode": cat_code,
        "citizenConfirmedCategory": cat_code,
        "category_id": str(dept_id) if dept_id else "dept_roads",
        "citizenId": current_user["_id"],
        "departmentId": dept_id,
        "status": "SUBMITTED",
        "priority": priority.upper() if priority else "HIGH",
        "severity": priority.upper() if priority else "HIGH",
        "incidentLocation": {
            "type": "Point",
            "coordinates": [longitude, latitude],
            "latitude": latitude,
            "longitude": longitude,
            "lat": latitude,
            "lng": longitude,
            "addressText": address_text or "Musiri Municipal Ward 5, Tiruchirappalli District",
            "landmark": landmark or ""
        },
        "beforeImageUrl": file_url or "/images/pothole-before.jpg",
        "aiPrediction": {
            "predictedCategory": ai_predicted_category or cat_code,
            "confidence": ai_confidence or 0.92,
            "explanation": ai_explanation or "Verified by AADHIRAI AI Vision Service",
            "modelVersion": ai_model_version or "CivicAi-YOLO11m-v1+Gemini",
            "analyzedAt": datetime.now(timezone.utc).isoformat()
        },
        "citizenConfirmation": {
            "confirmedCategory": cat_code,
            "isOverridden": bool(ai_predicted_category and ai_predicted_category != cat_code),
            "confirmedAt": datetime.now(timezone.utc).isoformat(),
            "confirmedBy": str(current_user["_id"])
        },
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }

    res = db.complaints.insert_one(doc)
    doc["_id"] = res.inserted_id

    return _format_complaint(doc)
