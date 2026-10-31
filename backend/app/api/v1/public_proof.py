from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import PublicProofRecord, Complaint
from app.schemas.schemas import PublicProofResponse

router = APIRouter(prefix="/public", tags=["Public Proof"])

@router.get("/proof/{public_reference}", response_model=PublicProofResponse)
def get_public_proof(
    public_reference: str,
    db: Session = Depends(get_db)
):
    # Lookup public proof record
    proof = db.query(PublicProofRecord).filter(
        PublicProofRecord.public_reference == public_reference
    ).first()

    if not proof:
        # Check if complaint exists but not yet verified
        complaint = db.query(Complaint).filter(Complaint.public_reference == public_reference).first()
        if complaint:
            raise HTTPException(
                status_code=403, 
                detail="This complaint is still undergoing resolution and verification. Proof has not yet been published."
            )
        raise HTTPException(status_code=404, detail="Public proof record not found")

    return proof
