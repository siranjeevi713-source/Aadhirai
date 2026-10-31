import io

def test_get_verification_status_unresolved(client, citizen_token):
    c_res = client.post(
        "/api/v1/complaints",
        data={
            "title": "Verif Test",
            "description": "Unresolved complaint test",
            "latitude": 10.9413,
            "longitude": 78.4485
        },
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = c_res.json()["id"]

    res = client.get(f"/api/v1/verification/{c_id}", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res.status_code == 200
    assert res.json()["verification_status"] == "UNSUBMITTED"

def test_verification_admin_review_approve(client, citizen_token, officer_token, admin_token):
    c_res = client.post(
        "/api/v1/complaints",
        data={"title": "Review Approve Test", "description": "Road fix", "latitude": 10.9413, "longitude": 78.4485},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = c_res.json()["id"]

    # Submit resolution
    fake_img = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08")
    client.post(
        f"/api/v1/officer/complaints/{c_id}/resolve",
        files={"resolution_file": ("after.jpg", fake_img, "image/jpeg")},
        data={"officer_notes": "Completed road repair"},
        headers={"Authorization": f"Bearer {officer_token}"}
    )

    # Admin reviews and approves
    res = client.post(
        f"/api/v1/verification/{c_id}/review",
        json={"action": "APPROVE", "justification": "Verified on-site by Assistant Executive Engineer"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    assert res.json()["verification_status"] == "PASSED"
    assert res.json()["complaint_status"] == "VERIFIED_RESOLVED"

def test_verification_admin_review_reject(client, citizen_token, officer_token, admin_token):
    c_res = client.post(
        "/api/v1/complaints",
        data={"title": "Review Reject Test", "description": "Drain cleaning", "latitude": 10.9413, "longitude": 78.4485},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = c_res.json()["id"]

    fake_img = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08")
    client.post(
        f"/api/v1/officer/complaints/{c_id}/resolve",
        files={"resolution_file": ("after.jpg", fake_img, "image/jpeg")},
        data={"officer_notes": "Cleaned drain"},
        headers={"Authorization": f"Bearer {officer_token}"}
    )

    # Admin rejects
    res = client.post(
        f"/api/v1/verification/{c_id}/review",
        json={"action": "REJECT", "justification": "Debris still visible in storm drain"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    assert res.json()["complaint_status"] == "REOPENED"

def test_public_proof_unverified_returns_403(client, citizen_token):
    c_res = client.post(
        "/api/v1/complaints",
        data={"title": "Unverified Proof Test", "description": "Test unverified privacy", "latitude": 10.9413, "longitude": 78.4485},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    ref = c_res.json()["public_reference"]

    res = client.get(f"/api/v1/public/proof/{ref}")
    assert res.status_code == 403

def test_public_proof_verified_returns_sanitized_data(client, citizen_token, officer_token, admin_token):
    c_res = client.post(
        "/api/v1/complaints",
        data={"title": "Sanitized Proof Test", "description": "Test privacy leak prevention", "latitude": 10.941324, "longitude": 78.448512},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    c_id = c_res.json()["id"]
    ref = c_res.json()["public_reference"]

    fake_img = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08")
    client.post(
        f"/api/v1/officer/complaints/{c_id}/resolve",
        files={"resolution_file": ("after.jpg", fake_img, "image/jpeg")},
        data={"officer_notes": "Completed"},
        headers={"Authorization": f"Bearer {officer_token}"}
    )

    client.post(
        f"/api/v1/verification/{c_id}/review",
        json={"action": "APPROVE", "justification": "Verified"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    res = client.get(f"/api/v1/public/proof/{ref}")
    assert res.status_code == 200
    data = res.json()
    assert "phone" not in data
    assert "email" not in data
    assert data["approximate_lat"] == 10.941 # Truncated to 3 decimals

def test_public_proof_nonexistent_returns_404(client):
    res = client.get("/api/v1/public/proof/ADH-NON-EXISTENT")
    assert res.status_code == 404

def test_citizen_cannot_review_verification(client, citizen_token):
    res = client.post(
        "/api/v1/verification/some-id/review",
        json={"action": "APPROVE", "justification": "Unauthorized"},
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert res.status_code == 403
