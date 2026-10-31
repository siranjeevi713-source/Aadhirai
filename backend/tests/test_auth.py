def test_register_citizen_success(client):
    res = client.post("/api/v1/auth/register", json={
        "phone": "+919999900001",
        "full_name": "மாரிமுத்து (Marimuthu)",
        "password": "SecurePassword123!",
        "preferred_language": "ta"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["phone"] == "+919999900001"

def test_register_duplicate_phone_fails(client):
    res = client.post("/api/v1/auth/register", json={
        "phone": "+919876543210", # Seeded phone
        "full_name": "Duplicate User",
        "password": "Password123!"
    })
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"]

def test_login_citizen_success(client):
    res = client.post("/api/v1/auth/login", json={
        "phone": "+919876543210",
        "password": "Password123!"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()

def test_login_invalid_password_fails(client):
    res = client.post("/api/v1/auth/login", json={
        "phone": "+919876543210",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
    assert "Invalid phone number or password" in res.json()["detail"]

def test_get_profile_authenticated(client, citizen_token):
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res.status_code == 200
    assert res.json()["phone"] == "+919876543210"

def test_get_profile_unauthenticated_fails(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401

def test_logout(client, citizen_token):
    res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
