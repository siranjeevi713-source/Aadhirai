from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user
from app.models.models import User, Complaint, AIPrediction, ComplaintEvidence
from app.schemas.schemas import (
    AIClassifyRequest, AIClassifyResponse, DuplicateCheckRequest, DuplicateMatch
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

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
    # Search complaints with same category within 150m radius
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
            # High proximity duplicate candidate
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
