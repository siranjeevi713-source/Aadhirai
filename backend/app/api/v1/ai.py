import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Complaint, AIPrediction, ComplaintCategory, RoutingRule, Department
from app.schemas.schemas import (
    AIClassifyResponse, CivicImageAnalysisResponse, DuplicateCheckRequest, DuplicateMatch
)
from app.services.ai_service import AIService
from app.services.routing_service import RoutingService

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

CANONICAL_TO_DB_CATEGORY = {
    "POTHOLE": "road_damage",
    "ROAD_DAMAGE": "road_damage",
    "DAMAGED_FOOTPATH": "road_damage",
    "GARBAGE_ACCUMULATION": "garbage_accumulation",
    "DRAINAGE_BLOCKAGE": "blocked_drainage",
    "SEWAGE_OVERFLOW": "blocked_drainage",
    "WATER_LEAKAGE": "water_leakage",
    "WATERLOGGING": "waterlogging",
    "BROKEN_STREETLIGHT": "broken_streetlight",
    "DAMAGED_ELECTRIC_POLE": "damaged_electrical",
    "DAMAGED_PUBLIC_INFRASTRUCTURE": "other_civic",
    "FALLEN_TREE": "other_civic",
    "OTHER_CIVIC_ISSUE": "other_civic",
    "UNCLEAR_OR_UNDETECTABLE": "other_civic",
}

@router.post("/analyze-civic-image", response_model=CivicImageAnalysisResponse)
@router.post("/classify-image", response_model=CivicImageAnalysisResponse)
async def analyze_civic_image_endpoint(
    file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None),
    user_hint: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Dedicated Civic Computer Vision Image Inspection Endpoint.
    1. Analyzes actual uploaded image bytes via Gemini Multimodal or Computer Vision CV Engine.
    2. Performs deterministic category-to-department lookup via DB routing rules.
    3. Returns validated, structured response with suggested department and confidence.
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

    pred_cat = analysis.get("predicted_category", "ROAD_DAMAGE")
    db_cat_code = CANONICAL_TO_DB_CATEGORY.get(pred_cat, "road_damage")

    # Fetch DB Category Record
    cat_record = db.query(ComplaintCategory).filter(ComplaintCategory.code == db_cat_code).first()
    if not cat_record:
        cat_record = db.query(ComplaintCategory).first()

    category_id = cat_record.id if cat_record else None
    category_name = cat_record.name_en if cat_record else "Road Damage / Pothole"

    # Deterministic Department Routing Lookup
    dept = RoutingService.determine_department(db, category_id) if category_id else None
    dept_name = dept.name_en if dept else "Municipal Roads Department"
    dept_id = dept.id if dept else None

    return CivicImageAnalysisResponse(
        predicted_category=pred_cat,
        category_id=category_id,
        category_name=category_name,
        confidence=analysis.get("confidence_score", 0.94),
        confidence_score=analysis.get("confidence_score", 0.94),
        severity=analysis.get("suggested_severity", "HIGH"),
        suggested_severity=analysis.get("suggested_severity", "HIGH"),
        issue_description=analysis.get("issue_description", ""),
        reason=analysis.get("issue_description", ""),
        visual_indicators=analysis.get("visual_indicators", []),
        suggested_department=dept_name,
        suggested_department_id=dept_id,
        image_quality=analysis.get("image_quality", "EXCELLENT"),
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

@router.post("/duplicate-check", response_model=List[DuplicateMatch])
def duplicate_check(
    payload: DuplicateCheckRequest,
    db: Session = Depends(get_db)
):
    complaints = db.query(Complaint).filter(
        Complaint.category_id == payload.category_id,
        Complaint.status.in_(["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "NEEDS_REVIEW"])
    ).all()

    matches = []
    for c in complaints:
        dist = AIService.calculate_distance_meters(
            payload.latitude, payload.longitude,
            c.latitude, c.longitude
        )
        if dist <= 150.0:
            similarity = max(0.5, 1.0 - (dist / 150.0))
            matches.append(DuplicateMatch(
                complaint_id=c.id,
                public_reference=c.public_reference,
                title=c.title,
                similarity_score=round(similarity, 2),
                distance_meters=round(dist, 1)
            ))

    return matches

@router.get("/predictions/{complaint_id}")
def get_complaint_ai_predictions(
    complaint_id: str,
    db: Session = Depends(get_db)
):
    predictions = db.query(AIPrediction).filter(AIPrediction.complaint_id == complaint_id).all()
    return predictions
