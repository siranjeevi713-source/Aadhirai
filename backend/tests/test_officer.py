import io

def test_officer_assignments_access(client, officer_token):
    res = client.get("/api/v1/officer/assignments", headers={"Authorization": f"Bearer {officer_token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_citizen_cannot_access_officer_assignments(client, citizen_token):
    res = client.get("/api/v1/officer/assignments", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res.status_code == 403

def test_officer_accept_assignment(client, citizen_token, officer_token):
    # Citizen creates
    c_res = client.post(
        "/api/v1/complaints",
        data={
            "title": "Acceptance Test",
            "description": "Officer accept test",
            "latitude": 10.9413,
            "longitude": 78.4485
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = c_res.json()["id"]

    # Officer accepts
    res = client.post(
        f"/api/v1/officer/complaints/{c_id}/accept",
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "IN_PROGRESS"

def test_officer_create_work_order(client, citizen_token, officer_token):
    c_res = client.post(
        "/api/v1/complaints",
        data={
            "title": "Work Order Test",
            "description": "Pothole patch order",
            "latitude": 10.9413,
            "longitude": 78.4485
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = c_res.json()["id"]

    res = client.post(
        f"/api/v1/officer/complaints/{c_id}/work-order",
        json={
            "title": "Road Patching WO",
            "action_plan": "Mobilize cold-mix asphalt team for ward 7",
            "estimated_cost": 4500.0
        },
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 200
    assert res.json()["order_number"].startswith("WO-MSR-")

def test_officer_submit_resolution_evidence(client, citizen_token, officer_token):
    c_res = client.post(
        "/api/v1/complaints",
        data={
            "title": "Resolution Flow Test",
            "description": "Pothole patch",
            "latitude": 10.9413,
            "longitude": 78.4485
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = c_res.json()["id"]

    # Fake image bytes
    fake_img = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08")
    res = client.post(
        f"/api/v1/officer/complaints/{c_id}/resolve",
        files={"resolution_file": ("after.jpg", fake_img, "image/jpeg")},
        data={"officer_notes": "Asphalt patch successfully applied and rolled."},
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 200
    assert "verification_status" in res.json()

def test_officer_cannot_self_verify_without_evidence(client, officer_token):
    # Attempting to resolve without file upload will fail validation
    res = client.post(
        "/api/v1/officer/complaints/dummy-id/resolve",
        data={"officer_notes": "Fake resolve without photo"},
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 422

def test_officer_assignments_filter_by_status(client, officer_token):
    res = client.get("/api/v1/officer/assignments?status=ASSIGNED", headers={"Authorization": f"Bearer {officer_token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)
