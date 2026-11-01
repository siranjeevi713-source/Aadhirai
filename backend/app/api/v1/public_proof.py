"""
Public proof endpoints for AADHIRAI FastAPI backend.
Uses pymongo instead of SQLAlchemy.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database
from bson import ObjectId
from app.core.database import get_db

router = APIRouter(prefix="/public", tags=["Public Proof"])


def _proof_doc(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "public_reference": doc.get("public_reference") or doc.get("ticketNumber", ""),
        "category_name": doc.get("category_name", "Civic Issue"),
        "approximate_lat": doc.get("approximate_lat"),
        "approximate_lon": doc.get("approximate_lon"),
        "ward_name": doc.get("ward_name", ""),
        "submitted_date": doc.get("submitted_date") or doc.get("createdAt"),
        "resolved_date": doc.get("resolved_date") or doc.get("resolvedAt"),
        "turnaround_hours": doc.get("turnaround_hours", 0.0),
        "before_image_url": doc.get("before_image_url") or doc.get("beforeImageUrl"),
        "after_image_url": doc.get("after_image_url") or doc.get("afterImageUrl"),
        "verification_summary": doc.get("verification_summary", ""),
        "qr_code_url": doc.get("qr_code_url", ""),
        "published_at": doc.get("published_at") or doc.get("verifiedAt") or doc.get("resolvedAt"),
    }


@router.get("/proofs")
def list_public_proofs(limit: int = 10, db: Database = Depends(get_db)):
    """Retrieve verified public proofs for public accountability record."""
    # Try dedicated proofs collection first, then fall back to resolved complaints
    proofs_col = db.list_collection_names()

    if "publicproofs" in proofs_col:
        docs = list(db.publicproofs.find().sort("published_at", -1).limit(limit))
        return [_proof_doc(d) for d in docs]

    # Fallback: use verified complaints as proof records
    complaints = list(db.complaints.find(
        {"status": {"$in": ["RESOLVED", "VERIFIED_RESOLVED", "CLOSED"]},
         "afterImageUrl": {"$ne": None}},
        {"ticketNumber": 1, "categoryCode": 1, "incidentLocation": 1, "incidentAddress": 1,
         "beforeImageUrl": 1, "afterImageUrl": 1, "resolvedAt": 1, "verifiedAt": 1, "createdAt": 1,
         "severity": 1}
    ).sort("resolvedAt", -1).limit(limit))

    results = []
    for c in complaints:
        loc = c.get("incidentLocation", {})
        lat = loc.get("lat")
        lon = loc.get("lng")
        from datetime import timezone
        created = c.get("createdAt")
        resolved = c.get("resolvedAt")
        turnaround = 0.0
        if created and resolved:
            import datetime as dt
            def tz(x):
                return x.replace(tzinfo=timezone.utc) if x and x.tzinfo is None else x
            try:
                turnaround = round((tz(resolved) - tz(created)).total_seconds() / 3600.0, 1)
            except Exception:
                pass

        results.append({
            "id": str(c["_id"]),
            "public_reference": c.get("ticketNumber", ""),
            "category_name": (c.get("categoryCode") or "OTHER").replace("_", " ").title(),
            "approximate_lat": round(lat, 3) if lat else None,
            "approximate_lon": round(lon, 3) if lon else None,
            "ward_name": c.get("incidentAddress", ""),
            "submitted_date": c.get("createdAt"),
            "resolved_date": c.get("resolvedAt"),
            "turnaround_hours": turnaround,
            "before_image_url": c.get("beforeImageUrl"),
            "after_image_url": c.get("afterImageUrl"),
            "verification_summary": f"Verified resolution for {(c.get('categoryCode') or 'OTHER').replace('_', ' ').title()}",
            "qr_code_url": f"/proof/{c.get('ticketNumber', '')}",
            "published_at": c.get("verifiedAt") or c.get("resolvedAt"),
        })
    return results


@router.get("/proof/{public_reference}")
def get_public_proof(public_reference: str, db: Database = Depends(get_db)):
    # Try proofs collection
    if "publicproofs" in db.list_collection_names():
        proof = db.publicproofs.find_one({"public_reference": public_reference})
        if proof:
            return _proof_doc(proof)

    # Fall back to complaint
    complaint = db.complaints.find_one({"ticketNumber": public_reference})
    if not complaint:
        raise HTTPException(status_code=404, detail="Public proof record not found")

    if complaint.get("status") not in ("RESOLVED", "VERIFIED_RESOLVED", "CLOSED"):
        raise HTTPException(
            status_code=403,
            detail="This complaint is still undergoing resolution. Proof has not yet been published."
        )

    loc = complaint.get("incidentLocation", {})
    return {
        "id": str(complaint["_id"]),
        "public_reference": complaint.get("ticketNumber", ""),
        "category_name": (complaint.get("categoryCode") or "OTHER").replace("_", " ").title(),
        "approximate_lat": round(loc.get("lat", 0), 3),
        "approximate_lon": round(loc.get("lng", 0), 3),
        "ward_name": complaint.get("incidentAddress", ""),
        "submitted_date": complaint.get("createdAt"),
        "resolved_date": complaint.get("resolvedAt"),
        "turnaround_hours": 0.0,
        "before_image_url": complaint.get("beforeImageUrl"),
        "after_image_url": complaint.get("afterImageUrl"),
        "verification_summary": "Verified resolution",
        "qr_code_url": f"/proof/{public_reference}",
        "published_at": complaint.get("verifiedAt") or complaint.get("resolvedAt"),
    }
