"""
Analytics endpoints for AADHIRAI FastAPI backend.
Uses pymongo aggregations instead of SQLAlchemy.
"""
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends
from pymongo.database import Database
from app.core.database import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
def get_analytics_overview(db: Database = Depends(get_db)):
    total = db.complaints.count_documents({})
    pending = db.complaints.count_documents({"status": {"$in": ["SUBMITTED", "ROUTED"]}})
    in_progress = db.complaints.count_documents({"status": "IN_PROGRESS"})
    resolved = db.complaints.count_documents({"status": {"$in": ["RESOLVED", "VERIFIED_RESOLVED", "CLOSED"]}})
    reopened = db.complaints.count_documents({"status": "REOPENED"})

    # SLA compliance: complaints resolved by due date
    resolved_complaints = list(db.complaints.find(
        {"status": {"$in": ["RESOLVED", "VERIFIED_RESOLVED", "CLOSED"]},
         "resolvedAt": {"$ne": None}},
        {"resolvedAt": 1, "dueAt": 1, "createdAt": 1}
    ))

    on_time_count = 0
    total_hours = 0.0

    def make_aware(dt):
        if dt is None:
            return None
        if isinstance(dt, datetime) and dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    for c in resolved_complaints:
        resolved_at = make_aware(c.get("resolvedAt"))
        due_at = make_aware(c.get("dueAt"))
        created_at = make_aware(c.get("createdAt"))
        if resolved_at and due_at and resolved_at <= due_at:
            on_time_count += 1
        if resolved_at and created_at:
            hours = (resolved_at - created_at).total_seconds() / 3600.0
            total_hours += max(0.5, hours)

    count = len(resolved_complaints)
    compliance_rate = round((on_time_count / count * 100.0), 1) if count else 100.0
    avg_hours = round((total_hours / count), 1) if count else 0.0

    return {
        "total_complaints": total,
        "pending_complaints": pending,
        "in_progress_complaints": in_progress,
        "resolved_complaints": resolved,
        "reopened_complaints": reopened,
        "escalated_complaints": 0,
        "sla_compliance_rate": compliance_rate,
        "average_resolution_hours": avg_hours
    }


@router.get("/departments")
def get_department_analytics(db: Database = Depends(get_db)):
    pipeline = [
        {"$group": {
            "_id": "$departmentId",
            "total": {"$sum": 1},
            "resolved": {"$sum": {
                "$cond": [{"$in": ["$status", ["RESOLVED", "VERIFIED_RESOLVED", "CLOSED"]]}, 1, 0]
            }}
        }}
    ]
    agg = list(db.complaints.aggregate(pipeline))
    results = []
    from bson import ObjectId
    for item in agg:
        dept_id = item["_id"]
        dept_name = "Unknown Department"
        if dept_id:
            try:
                dept = db.departments.find_one({"_id": ObjectId(str(dept_id))})
                if dept:
                    dept_name = dept.get("name", dept_name)
            except Exception:
                pass
        total = item["total"]
        resolved = item["resolved"]
        rate = round((resolved / total * 100.0), 1) if total > 0 else 100.0
        results.append({
            "department_name": dept_name,
            "total_assigned": total,
            "resolved_count": resolved,
            "compliance_rate": rate
        })
    return results


@router.get("/hotspots")
def get_civic_hotspots(db: Database = Depends(get_db)):
    active = list(db.complaints.find(
        {"status": {"$in": ["SUBMITTED", "ROUTED", "IN_PROGRESS"]}},
        {"incidentLocation": 1, "categoryCode": 1, "severity": 1}
    ))
    clusters = {}
    for c in active:
        loc = c.get("incidentLocation", {})
        lat = loc.get("lat") or loc.get("latitude")
        lon = loc.get("lng") or loc.get("longitude")
        if lat is None or lon is None:
            continue
        key = (round(lat, 3), round(lon, 3), c.get("categoryCode", "OTHER"))
        if key not in clusters:
            clusters[key] = {"count": 0, "priority": c.get("severity", "MEDIUM")}
        clusters[key]["count"] += 1
        if c.get("severity") in ["HIGH", "CRITICAL"]:
            clusters[key]["priority"] = "CRITICAL"

    hotspots = []
    for (lat, lon, cat_code), data in clusters.items():
        hotspots.append({
            "category_name": cat_code.replace("_", " ").title(),
            "latitude": lat,
            "longitude": lon,
            "incident_count": data["count"],
            "severity": data["priority"]
        })
    return hotspots
