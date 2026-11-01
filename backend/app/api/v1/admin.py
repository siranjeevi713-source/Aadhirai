"""
Admin endpoints for AADHIRAI FastAPI backend.
Uses pymongo instead of SQLAlchemy.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from bson import ObjectId
from app.core.database import get_db
from app.core.rbac import require_role

router = APIRouter(prefix="/admin", tags=["Admin Operations"])


def _oid(id_str: str):
    try:
        return ObjectId(id_str)
    except Exception:
        return id_str


@router.get("/categories")
def list_categories(db: Database = Depends(get_db)):
    cats = list(db.categories.find({}, {"__v": 0}))
    for c in cats:
        c["id"] = str(c.pop("_id"))
    return cats


@router.post("/categories", status_code=201)
def create_category(
    payload: dict,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: Database = Depends(get_db)
):
    existing = db.categories.find_one({"code": payload.get("code")})
    if existing:
        raise HTTPException(status_code=400, detail="Category code already exists")
    result = db.categories.insert_one(payload)
    payload["id"] = str(result.inserted_id)
    return payload


@router.get("/departments")
def list_departments(db: Database = Depends(get_db)):
    depts = list(db.departments.find({}, {"__v": 0}))
    for d in depts:
        d["id"] = str(d.pop("_id"))
        if "districtId" in d:
            d["districtId"] = str(d["districtId"])
    return depts


@router.get("/districts")
def list_districts(db: Database = Depends(get_db)):
    districts = list(db.districts.find({}, {"__v": 0}))
    for d in districts:
        d["id"] = str(d.pop("_id"))
    return districts


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: Database = Depends(get_db)
):
    logs = list(db.auditlogs.find({}, {"__v": 0}).sort("createdAt", -1).limit(limit))
    for log in logs:
        log["id"] = str(log.pop("_id"))
        if "userId" in log:
            log["userId"] = str(log["userId"])
    return logs


@router.get("/users")
def list_users(
    limit: int = 50,
    current_user: dict = Depends(require_role(["admin", "super_admin"])),
    db: Database = Depends(get_db)
):
    users = list(db.users.find({}, {"passwordHash": 0, "__v": 0}).limit(limit))
    for u in users:
        u["id"] = str(u.pop("_id"))
        if "districtId" in u and u["districtId"]:
            u["districtId"] = str(u["districtId"])
        if "departmentId" in u and u["departmentId"]:
            u["departmentId"] = str(u["departmentId"])
    return users
