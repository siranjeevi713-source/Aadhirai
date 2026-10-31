def test_submit_complaint_minimal(client, citizen_token):
    res = client.post(
        "/api/v1/complaints",
        data={
            "title": "சாலை சேதம் (Pothole on Main Road)",
            "description": "பெரிய குழி உள்ளதால் வாகன ஓட்டிகள் அவதிப்படுகின்றனர்.",
            "latitude": 10.9413,
            "longitude": 78.4485
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["public_reference"].startswith("ADH-2026-MSR-")
    assert data["status"] in ["SUBMITTED", "ASSIGNED"]

def test_submit_complaint_with_category(client, citizen_token):
    cat_res = client.get("/api/v1/admin/categories")
    cat_id = cat_res.json()[0]["id"]
    
    res = client.post(
        "/api/v1/complaints",
        data={
            "title": "தெருவிளக்கு எரியவில்லை",
            "description": "இரவில் மிகவும் இருட்டாக உள்ளது.",
            "category_id": cat_id,
            "latitude": 10.9450,
            "longitude": 78.4420
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 201
    assert res.json()["category"]["id"] == cat_id

def test_submit_complaint_unauthenticated_fails(client):
    res = client.post(
        "/api/v1/complaints",
        data={
            "title": "Invalid submission",
            "description": "No auth token",
            "latitude": 10.94,
            "longitude": 78.44
        }
    )
    assert res.status_code == 401

def test_list_complaints_citizen_scope(client, citizen_token):
    res = client.get("/api/v1/complaints", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_get_complaint_details_success(client, citizen_token):
    # Create complaint
    create_res = client.post(
        "/api/v1/complaints",
        data={
            "title": "வடிகால் அடைப்பு",
            "description": "மழைநீர் வடிகாலில் கழிவு அடைத்துள்ளது",
            "latitude": 10.9413,
            "longitude": 78.4485
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = create_res.json()["id"]

    res = client.get(f"/api/v1/complaints/{c_id}", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res.status_code == 200
    assert res.json()["id"] == c_id

def test_get_complaint_history(client, citizen_token):
    create_res = client.post(
        "/api/v1/complaints",
        data={
            "title": "Timeline Test",
            "description": "Tracking status history",
            "latitude": 10.9413,
            "longitude": 78.4485
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = create_res.json()["id"]

    res = client.get(f"/api/v1/complaints/{c_id}/history", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res.status_code == 200
    assert len(res.json()) >= 1

def test_submit_complaint_feedback(client, citizen_token):
    create_res = client.post(
        "/api/v1/complaints",
        data={
            "title": "Feedback Test",
            "description": "Citizen rating test",
            "latitude": 10.9413,
            "longitude": 78.4485
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = create_res.json()["id"]

    res = client.post(
        f"/api/v1/complaints/{c_id}/feedback",
        json={"rating": 5, "comments": "Excellent rapid resolution!"},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 200
    assert "successfully" in res.json()["message"]

def test_dispute_complaint_resolution(client, citizen_token):
    create_res = client.post(
        "/api/v1/complaints",
        data={
            "title": "Dispute Test",
            "description": "Citizen dispute flow",
            "latitude": 10.9413,
            "longitude": 78.4485
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = create_res.json()["id"]

    res = client.post(
        f"/api/v1/complaints/{c_id}/dispute",
        json={"reason": "Pothole not filled properly, gravel loose."},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 200
    assert "escalated" in res.json()["message"]
