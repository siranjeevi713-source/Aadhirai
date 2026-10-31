from datetime import datetime, timezone, timedelta
from app.services.sla_service import SLAService
from app.models.models import Complaint, ComplaintCategory

def test_calculate_due_date_road_damage(db):
    cat = db.query(ComplaintCategory).filter(ComplaintCategory.code == "road_damage").first()
    due = SLAService.calculate_due_date(db, cat.id, priority="MEDIUM")
    assert due > datetime.now(timezone.utc)
    delta = due - datetime.now(timezone.utc)
    assert 60 <= delta.total_seconds() / 3600 <= 75

def test_calculate_due_date_critical_priority(db):
    cat = db.query(ComplaintCategory).filter(ComplaintCategory.code == "road_damage").first()
    due = SLAService.calculate_due_date(db, cat.id, priority="CRITICAL")
    delta = due - datetime.now(timezone.utc)
    # Critical cuts SLA to 40%
    assert delta.total_seconds() / 3600 < 50

def test_escalation_tier_1_trigger(db):
    cat = db.query(ComplaintCategory).first()
    c = Complaint(
        public_reference="ADH-TEST-ESC-1",
        citizen_id="dummy",
        category_id=cat.id,
        title="Escalation Test",
        description="Testing escalation level 1",
        latitude=10.94,
        longitude=78.44
    )
    db.add(c)
    db.commit()

    event = SLAService.check_and_escalate(db, c, reason="SLA_OVERDUE")
    assert event is not None
    assert event.level == 1
    assert event.trigger_reason == "SLA_OVERDUE"

def test_escalation_tier_2_trigger(db):
    cat = db.query(ComplaintCategory).first()
    c = Complaint(
        public_reference="ADH-TEST-ESC-2",
        citizen_id="dummy",
        category_id=cat.id,
        title="Escalation Test 2",
        description="Testing multi-tier",
        latitude=10.94,
        longitude=78.44
    )
    db.add(c)
    db.commit()

    SLAService.check_and_escalate(db, c, reason="SLA_OVERDUE")
    event2 = SLAService.check_and_escalate(db, c, reason="STILL_UNRESOLVED")
    assert event2.level == 2

def test_escalation_cap_at_tier_3(db):
    cat = db.query(ComplaintCategory).first()
    c = Complaint(
        public_reference="ADH-TEST-ESC-3",
        citizen_id="dummy",
        category_id=cat.id,
        title="Escalation Cap Test",
        description="Testing max level cap",
        latitude=10.94,
        longitude=78.44
    )
    db.add(c)
    db.commit()

    SLAService.check_and_escalate(db, c)
    SLAService.check_and_escalate(db, c)
    SLAService.check_and_escalate(db, c)
    event4 = SLAService.check_and_escalate(db, c)
    assert event4.level == 3 # Capped at Level 3

def test_citizen_dispute_triggers_escalation(client, citizen_token):
    c_res = client.post(
        "/api/v1/complaints",
        data={"title": "Dispute Escalation", "description": "Road fix", "latitude": 10.9413, "longitude": 78.4485},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = c_res.json()["id"]

    res = client.post(
        f"/api/v1/complaints/{c_id}/dispute",
        json={"reason": "Poor quality fix"},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 200

def test_admin_view_audit_logs(client, admin_token):
    res = client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)
