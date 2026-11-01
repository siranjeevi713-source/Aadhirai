"""
AI Analysis endpoint for AADHIRAI FastAPI backend.
Uses MongoDB (pymongo) for department routing lookup.
"""
import io
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pymongo.database import Database
from bson import ObjectId
from app.core.database import get_db
from app.schemas.schemas import CivicImageAnalysisResponse, AIClassifyResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

# Map canonical AI category codes → MongoDB category codes
CANONICAL_TO_MONGO_CODE = {
    "POTHOLE": "POTHOLE",
    "ROAD_DAMAGE": "ROAD_DAMAGE",
    "DAMAGED_FOOTPATH": "ROAD_DAMAGE",
    "GARBAGE_ACCUMULATION": "GARBAGE_ACCUMULATION",
    "DRAINAGE_BLOCKAGE": "DRAINAGE_BLOCKAGE",
    "SEWAGE_OVERFLOW": "SEWAGE_OVERFLOW",
    "WATER_LEAKAGE": "WATER_LEAKAGE",
    "WATERLOGGING": "WATERLOGGING",
    "BROKEN_STREETLIGHT": "BROKEN_STREETLIGHT",
    "DAMAGED_ELECTRIC_POLE": "BROKEN_STREETLIGHT",
    "DAMAGED_PUBLIC_INFRASTRUCTURE": "DAMAGED_PUBLIC_INFRASTRUCTURE",
    "FALLEN_TREE": "FALLEN_TREE",
    "OTHER_CIVIC_ISSUE": "OTHER",
    "UNCLEAR_OR_UNDETECTABLE": "OTHER",
    "OTHER": "OTHER",
}

# Fallback department name mapping when routing rule is not found
CATEGORY_DEPT_FALLBACK = {
    "POTHOLE": "Roads & Infrastructure",
    "ROAD_DAMAGE": "Roads & Infrastructure",
    "GARBAGE_ACCUMULATION": "Sanitation & Solid Waste",
    "DRAINAGE_BLOCKAGE": "Water & Drainage",
    "SEWAGE_OVERFLOW": "Water & Drainage",
    "WATER_LEAKAGE": "Water & Drainage",
    "WATERLOGGING": "Water & Drainage",
    "BROKEN_STREETLIGHT": "Electrical & Street Lighting",
    "DAMAGED_PUBLIC_INFRASTRUCTURE": "Public Works",
    "FALLEN_TREE": "Parks & Environment",
    "OTHER": "General Administration",
}


def _lookup_department(db: Database, category_code: str) -> dict:
    """Look up department from MongoDB routing rules by category code."""
    rule = db.routingrules.find_one({"categoryCode": category_code, "isActive": True})
    if rule and rule.get("departmentId"):
        dept_id = rule["departmentId"]
        if isinstance(dept_id, str):
            try:
                dept_id = ObjectId(dept_id)
            except Exception:
                pass
        dept = db.departments.find_one({"_id": dept_id})
        if dept:
            return {
                "id": str(dept["_id"]),
                "name": dept.get("name", CATEGORY_DEPT_FALLBACK.get(category_code, "General Administration")),
            }
    # Fallback: look up by name pattern
    fallback_name = CATEGORY_DEPT_FALLBACK.get(category_code, "General Administration")
    dept = db.departments.find_one({"name": {"$regex": fallback_name.split("&")[0].strip(), "$options": "i"}})
    if dept:
        return {"id": str(dept["_id"]), "name": dept.get("name", fallback_name)}
    return {"id": None, "name": fallback_name}


def _lookup_category(db: Database, category_code: str) -> dict:
    """Look up category document from MongoDB."""
    cat = db.categories.find_one({"code": category_code})
    if cat:
        return {
            "id": str(cat["_id"]),
            "name": cat.get("name", category_code.replace("_", " ").title()),
            "nameTa": cat.get("nameTa", ""),
        }
    return {"id": None, "name": category_code.replace("_", " ").title(), "nameTa": ""}


@router.post("/analyze-civic-image", response_model=CivicImageAnalysisResponse)
@router.post("/classify-image", response_model=CivicImageAnalysisResponse)
async def analyze_civic_image_endpoint(
    file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None),
    user_hint: Optional[str] = Form(None),
    db: Database = Depends(get_db)
):
    """
    Civic Computer Vision Image Analysis Endpoint.
    1. Analyzes uploaded image via CV Engine / Gemini Multimodal.
    2. Performs category-to-department routing lookup via MongoDB.
    3. Returns validated structured response.
    """
    target_file = file or image_file
    if not target_file:
        raise HTTPException(status_code=400, detail="No image file provided for AI analysis")

    image_bytes = await target_file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    mime_type = target_file.content_type or "image/jpeg"
    analysis = AIService.analyze_civic_image(
        image_bytes=image_bytes,
        mime_type=mime_type,
        user_hint=user_hint
    )

    pred_cat = analysis.get("predicted_category", "OTHER")
    is_civic = analysis.get("is_civic_issue", pred_cat not in ("NON_CIVIC_IMAGE", "UNCLEAR_OR_UNDETECTABLE"))
    mongo_code = CANONICAL_TO_MONGO_CODE.get(pred_cat, pred_cat)

    if not is_civic or pred_cat == "NON_CIVIC_IMAGE":
        return CivicImageAnalysisResponse(
            predicted_category="NON_CIVIC_IMAGE",
            category_id=None,
            category_name="Non-Civic Image (Invalid)",
            confidence=analysis.get("confidence_score", 0.15),
            confidence_score=analysis.get("confidence_score", 0.15),
            severity="NONE",
            suggested_severity="NONE",
            issue_description=analysis.get("issue_description", "The uploaded photograph does not appear to be an actionable civic infrastructure defect."),
            reason=analysis.get("issue_description", "The uploaded photograph does not appear to be an actionable civic infrastructure defect."),
            visual_indicators=analysis.get("visual_indicators", ["Non-civic subject"]),
            suggested_department="None (Not a Civic Issue)",
            suggested_department_id=None,
            image_quality=analysis.get("image_quality", "POOR"),
            uncertainty_reason="Image does not depict a municipal defect",
            requires_human_confirmation=True,
            requires_human_review=True,
            provider_used=analysis.get("provider_used", "computer_vision_cv_engine")
        )

    # MongoDB lookups
    cat_doc = _lookup_category(db, mongo_code)
    dept_doc = _lookup_department(db, mongo_code)

    return CivicImageAnalysisResponse(
        predicted_category=pred_cat,
        category_id=cat_doc["id"],
        category_name=cat_doc["name"],
        confidence=analysis.get("confidence_score", 0.0),
        confidence_score=analysis.get("confidence_score", 0.0),
        severity=analysis.get("suggested_severity", "MEDIUM"),
        suggested_severity=analysis.get("suggested_severity", "MEDIUM"),
        issue_description=analysis.get("issue_description", ""),
        reason=analysis.get("issue_description", ""),
        visual_indicators=analysis.get("visual_indicators", []),
        suggested_department=dept_doc["name"],
        suggested_department_id=dept_doc["id"],
        image_quality=analysis.get("image_quality", "GOOD"),
        uncertainty_reason=analysis.get("uncertainty_reason"),
        requires_human_confirmation=analysis.get("requires_human_confirmation", True),
        requires_human_review=analysis.get("requires_human_confirmation", True),
        provider_used=analysis.get("provider_used", "computer_vision_cv_engine")
    )


@router.post("/classify", response_model=AIClassifyResponse)
async def classify_text(
    description: str = Form(...),
    image_file: Optional[UploadFile] = File(None)
):
    image_bytes = None
    if image_file:
        image_bytes = await image_file.read()
    result = AIService.classify_grievance(description, image_bytes)
    return AIClassifyResponse(**result)


@router.post("/duplicate-check")
def duplicate_check(
    category_code: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    db: Database = Depends(get_db)
):
    """Check for nearby duplicate complaints in MongoDB."""
    complaints = list(db.complaints.find(
        {
            "categoryCode": category_code,
            "status": {"$in": ["SUBMITTED", "ROUTED", "IN_PROGRESS", "NEEDS_REVIEW"]}
        },
        {"_id": 1, "ticketNumber": 1, "title": 1, "incidentLocation": 1}
    ))

    matches = []
    for c in complaints:
        loc = c.get("incidentLocation", {})
        c_lat = loc.get("lat") or loc.get("latitude")
        c_lon = loc.get("lng") or loc.get("longitude")
        if c_lat is None or c_lon is None:
            continue
        dist = AIService.calculate_distance_meters(latitude, longitude, c_lat, c_lon)
        if dist <= 150.0:
            similarity = max(0.5, 1.0 - (dist / 150.0))
            matches.append({
                "complaint_id": str(c["_id"]),
                "public_reference": c.get("ticketNumber", ""),
                "title": c.get("title", ""),
                "similarity_score": round(similarity, 2),
                "distance_meters": round(dist, 1)
            })
    return matches
