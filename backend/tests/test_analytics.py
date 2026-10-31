def test_analytics_overview_structure(client):
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_complaints" in data
    assert "pending_complaints" in data
    assert "sla_compliance_rate" in data

def test_analytics_wards_returns_all_24_wards(client):
    res = client.get("/api/v1/analytics/wards")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 24
    assert data[0]["ward_number"] == 1

def test_analytics_departments(client):
    res = client.get("/api/v1/analytics/departments")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5

def test_analytics_hotspots(client):
    res = client.get("/api/v1/analytics/hotspots")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_admin_list_categories(client):
    res = client.get("/api/v1/admin/categories")
    assert res.status_code == 200
    assert len(res.json()) >= 8

def test_admin_create_category(client, admin_token):
    res = client.post(
        "/api/v1/admin/categories",
        json={
            "code": "new_civic_test_cat",
            "name_en": "Encroachment Issue",
            "name_ta": "ஆக்கிரமிப்பு பிரச்சனை",
            "default_priority": "MEDIUM"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 201
    assert res.json()["code"] == "new_civic_test_cat"
