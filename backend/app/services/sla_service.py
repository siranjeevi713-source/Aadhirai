from datetime import datetime, timedelta, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.models import Complaint, SLAPolicy, EscalationEvent, AuditLog

class SLAService:
    @staticmethod
    def calculate_due_date(db: Session, category_id: str, priority: str = "MEDIUM") -> datetime:
        """Calculate due date based on category SLA policy."""
        policy = db.query(SLAPolicy).filter(SLAPolicy.category_id == category_id).first()
        base_hours = policy.max_resolution_hours if policy else 48
        
        # Priority adjustment
        if priority == "CRITICAL":
            base_hours = max(12, int(base_hours * 0.4))
        elif priority == "HIGH":
            base_hours = max(24, int(base_hours * 0.7))
        elif priority == "LOW":
            base_hours = int(base_hours * 1.5)

        return datetime.now(timezone.utc) + timedelta(hours=base_hours)

    @staticmethod
    def check_and_escalate(db: Session, complaint: Complaint, reason: str = "SLA_OVERDUE") -> Optional[EscalationEvent]:
        """Trigger an escalation event for the complaint."""
        existing_count = db.query(EscalationEvent).filter(EscalationEvent.complaint_id == complaint.id).count()
        next_level = min(3, existing_count + 1)

        event = EscalationEvent(
            complaint_id=complaint.id,
            level=next_level,
            trigger_reason=reason
        )
        db.add(event)
        
        db.add(AuditLog(
            action=f"ESCALATION_LEVEL_{next_level}_TRIGGERED",
            entity_type="Complaint",
            entity_id=complaint.id,
            details=f"Escalated to Level {next_level} due to {reason}."
        ))

        db.commit()
        db.refresh(event)
        return event
