from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import ComplaintCategory, Ward, Department
from app.schemas.schemas import CategoryResponse, WardResponse, DepartmentResponse
from app.api.v1.auth import router as auth_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.officer import router as officer_router
from app.api.v1.verification import router as verification_router
from app.api.v1.ai import router as ai_router
from app.api.v1.public_proof import router as public_proof_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter()

# Top-level public categories and wards endpoints for citizen forms
@api_router.get("/categories", response_model=list[CategoryResponse], tags=["Public Metadata"])
def get_public_categories(db: Session = Depends(get_db)):
    return db.query(ComplaintCategory).all()

@api_router.get("/wards", response_model=list[WardResponse], tags=["Public Metadata"])
def get_public_wards(db: Session = Depends(get_db)):
    return db.query(Ward).order_by(Ward.ward_number.asc()).all()

@api_router.get("/wards/lookup", tags=["Public Metadata"])
def lookup_ward_by_coords(lat: float, lon: float, db: Session = Depends(get_db)):
    from app.services.routing_service import RoutingService
    ward = RoutingService.match_ward(db, lat, lon)
    if ward:
        return {
            "found": True,
            "ward_id": ward.id,
            "ward_number": ward.ward_number,
            "name_en": ward.name_en,
            "name_ta": ward.name_ta,
            "boundary_geojson": ward.boundary_geojson,
            "municipality": "Musiri Municipality",
            "zone": f"Zone {((ward.ward_number - 1) // 6) + 1}",
            "nearby_landmarks": [
                "Musiri Kaveri River Bank",
                "Perumal Kovil Street",
                "Musiri New Bus Stand",
                "Tiruchirappalli Main Road"
            ]
        }
    return {
        "found": False,
        "ward_number": 5,
        "name_en": "Musiri Central",
        "name_ta": "முசிறி மத்திய பகுதி",
        "municipality": "Musiri Municipality",
        "zone": "Central Zone",
        "nearby_landmarks": ["Musiri Bus Stand", "Kaveri Bridge"]
    }

@api_router.get("/departments", response_model=list[DepartmentResponse], tags=["Public Metadata"])
def get_public_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@api_router.get("/routing/suggestions", tags=["Routing Intelligence"])
def get_routing_suggestions(category_id: str, db: Session = Depends(get_db)):
    from app.services.routing_service import RoutingService
    dept = RoutingService.determine_department(db, category_id)
    return {
        "category_id": category_id,
        "responsible_department": dept.name_en if dept else "Municipal General Administration",
        "responsible_department_id": dept.id if dept else None,
        "is_configured": bool(dept)
    }

api_router.include_router(auth_router)
api_router.include_router(complaints_router)
api_router.include_router(officer_router)
api_router.include_router(verification_router)
api_router.include_router(ai_router)
api_router.include_router(public_proof_router)
api_router.include_router(analytics_router)
api_router.include_router(admin_router)
