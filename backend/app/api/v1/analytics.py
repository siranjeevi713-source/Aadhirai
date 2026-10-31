from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import (
    Complaint, Ward, Department, EscalationEvent, ComplaintCategory
)
from app.schemas.schemas import (
    AnalyticsOverviewResponse, WardStatResponse, DepartmentStatResponse, HotspotItem
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(db: Session = Depends(get_db)):
    total = db.query(Complaint).count()
    pending = db.query(Complaint).filter(Complaint.status.in_(["SUBMITTED", "ASSIGNED"])).count()
    in_progress = db.query(Complaint).filter(Complaint.status == "IN_PROGRESS").count()
    resolved = db.query(Complaint).filter(Complaint.status == "VERIFIED_RESOLVED").count()
    reopened = db.query(Complaint).filter(Complaint.status == "REOPENED").count()
    escalated = db.query(EscalationEvent).filter(EscalationEvent.is_resolved == False).count()

    # Calculate SLA compliance rate
    resolved_complaints = db.query(Complaint).filter(Complaint.status == "VERIFIED_RESOLVED").all()
    on_time_count = 0
    total_hours = 0.0

    def make_aware(dt):
        if dt is None:
            return None
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    for c in resolved_complaints:
        if c.resolved_at and c.due_at:
            if make_aware(c.resolved_at) <= make_aware(c.due_at):
                on_time_count += 1
        if c.resolved_at and c.created_at:
            hours = (make_aware(c.resolved_at) - make_aware(c.created_at)).total_seconds() / 3600.0
            total_hours += max(0.5, hours)

    compliance_rate = round((on_time_count / len(resolved_complaints) * 100.0), 1) if resolved_complaints else 100.0
    avg_hours = round((total_hours / len(resolved_complaints)), 1) if resolved_complaints else 0.0

    return AnalyticsOverviewResponse(
        total_complaints=total,
        pending_complaints=pending,
        in_progress_complaints=in_progress,
        resolved_complaints=resolved,
        reopened_complaints=reopened,
        escalated_complaints=escalated,
        sla_compliance_rate=compliance_rate,
        average_resolution_hours=avg_hours
    )

@router.get("/wards", response_model=List[WardStatResponse])
def get_ward_analytics(db: Session = Depends(get_db)):
    wards = db.query(Ward).order_by(Ward.ward_number.asc()).all()
    stats = []
    for w in wards:
        complaints_count = db.query(Complaint).filter(Complaint.ward_id == w.id).count()
        resolved_count = db.query(Complaint).filter(
            Complaint.ward_id == w.id, 
            Complaint.status == "VERIFIED_RESOLVED"
        ).count()
        stats.append(WardStatResponse(
            ward_number=w.ward_number,
            ward_name=w.name_ta,
            complaint_count=complaints_count,
            resolved_count=resolved_count
        ))
    return stats

@router.get("/departments", response_model=List[DepartmentStatResponse])
def get_department_analytics(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    stats = []
    for d in depts:
        total = db.query(Complaint).filter(Complaint.assigned_department_id == d.id).count()
        resolved = db.query(Complaint).filter(
            Complaint.assigned_department_id == d.id,
            Complaint.status == "VERIFIED_RESOLVED"
        ).count()
        rate = round((resolved / total * 100.0), 1) if total > 0 else 100.0
        stats.append(DepartmentStatResponse(
            department_name=d.name_ta,
            total_assigned=total,
            resolved_count=resolved,
            compliance_rate=rate
        ))
    return stats

@router.get("/hotspots", response_model=List[HotspotItem])
def get_civic_hotspots(db: Session = Depends(get_db)):
    # Group by category and rounded coordinates to show clustering
    active_complaints = db.query(Complaint).filter(
        Complaint.status.in_(["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "NEEDS_REVIEW"])
    ).all()

    clusters = {}
    for c in active_complaints:
        key = (round(c.latitude, 3), round(c.longitude, 3), c.category.name_ta)
        if key not in clusters:
            clusters[key] = {"count": 0, "priority": c.priority}
        clusters[key]["count"] += 1
        if c.priority in ["HIGH", "CRITICAL"]:
            clusters[key]["priority"] = "CRITICAL"

    hotspots = []
    for (lat, lon, cat_name), data in clusters.items():
        hotspots.append(HotspotItem(
            category_name=cat_name,
            latitude=lat,
            longitude=lon,
            incident_count=data["count"],
            severity=data["priority"]
        ))
    return hotspots
