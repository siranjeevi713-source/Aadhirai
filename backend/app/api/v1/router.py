"""
Main API router for AADHIRAI FastAPI backend.
All sub-routers use pymongo (MongoDB) for data access.
"""
from fastapi import APIRouter, Depends
from pymongo.database import Database
from app.core.database import get_db
from app.api.v1.auth import router as auth_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.officer import router as officer_router
from app.api.v1.verification import router as verification_router
from app.api.v1.ai import router as ai_router
from app.api.v1.public_proof import router as public_proof_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter()


@api_router.get("/categories", tags=["Public Metadata"])
def get_public_categories(db: Database = Depends(get_db)):
    cats = list(db.categories.find({"isActive": True}, {"__v": 0}))
    for c in cats:
        c["id"] = str(c.pop("_id"))
    return cats


@api_router.get("/departments", tags=["Public Metadata"])
def get_public_departments(db: Database = Depends(get_db)):
    depts = list(db.departments.find({"isActive": True}, {"__v": 0}))
    for d in depts:
        d["id"] = str(d.pop("_id"))
        if "districtId" in d and d["districtId"]:
            d["districtId"] = str(d["districtId"])
    return depts


@api_router.get("/routing/suggestions", tags=["Routing Intelligence"])
def get_routing_suggestions(category_code: str, db: Database = Depends(get_db)):
    from bson import ObjectId
    rule = db.routingrules.find_one({"categoryCode": category_code, "isActive": True})
    dept_name = "Municipal General Administration"
    dept_id = None
    if rule and rule.get("departmentId"):
        try:
            dept = db.departments.find_one({"_id": ObjectId(str(rule["departmentId"]))})
            if dept:
                dept_name = dept.get("name", dept_name)
                dept_id = str(dept["_id"])
        except Exception:
            pass
    return {
        "category_code": category_code,
        "responsible_department": dept_name,
        "responsible_department_id": dept_id,
        "is_configured": bool(dept_id)
    }


api_router.include_router(auth_router)
api_router.include_router(complaints_router)
api_router.include_router(officer_router)
api_router.include_router(verification_router)
api_router.include_router(ai_router)
api_router.include_router(public_proof_router)
api_router.include_router(analytics_router)
api_router.include_router(admin_router)
