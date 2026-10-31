from app.services.routing_service import RoutingService
from app.models.models import ComplaintCategory, Department

def test_match_ward_musiri_center(db):
    # Centered near Ward 7 (10.9413, 78.4485)
    ward = RoutingService.match_ward(db, 10.9413, 78.4485)
    assert ward is not None
    assert ward.ward_number == 7

def test_match_ward_north_musiri(db):
    # Near Kavery Riverbank North (10.9450, 78.4420)
    ward = RoutingService.match_ward(db, 10.9451, 78.4421)
    assert ward is not None
    assert ward.ward_number == 1

def test_determine_department_roads(db):
    cat = db.query(ComplaintCategory).filter(ComplaintCategory.code == "road_damage").first()
    dept = RoutingService.determine_department(db, cat.id)
    assert dept is not None
    assert dept.code == "DEPT_ROADS"

def test_determine_department_sanitation(db):
    cat = db.query(ComplaintCategory).filter(ComplaintCategory.code == "garbage_accumulation").first()
    dept = RoutingService.determine_department(db, cat.id)
    assert dept is not None
    assert dept.code == "DEPT_SANITATION"

def test_determine_department_electrical(db):
    cat = db.query(ComplaintCategory).filter(ComplaintCategory.code == "broken_streetlight").first()
    dept = RoutingService.determine_department(db, cat.id)
    assert dept is not None
    assert dept.code == "DEPT_ELECTRICAL"

def test_assign_officer_available(db):
    dept = db.query(Department).filter(Department.code == "DEPT_ROADS").first()
    officer = RoutingService.assign_officer(db, dept.id)
    assert officer is not None
    assert officer.badge_number == "MSR-AE-RD-07"

def test_admin_list_wards_api(client):
    res = client.get("/api/v1/admin/wards")
    assert res.status_code == 200
    assert len(res.json()) == 24
