from app.services.ai_service import AIService

def test_classify_road_damage_tamil():
    result = AIService.classify_grievance("ரோட்டில் பெரிய குழி உள்ளது விபத்து அபாயம்")
    assert result["suggested_category"] == "road_damage"
    assert result["severity"] == "HIGH"
    assert result["confidence"] > 0.8

def test_classify_garbage_tamil():
    result = AIService.classify_grievance("சாலையோரம் துர்நாற்றத்துடன் அதிக குப்பை குவிந்துள்ளது")
    assert result["suggested_category"] == "garbage_accumulation"
    assert result["confidence"] > 0.8

def test_classify_streetlight_english():
    result = AIService.classify_grievance("The street light in front of house is broken and dark")
    assert result["suggested_category"] == "broken_streetlight"

def test_classify_water_leakage_english():
    result = AIService.classify_grievance("Severe drinking water pipe leakage on main road")
    assert result["suggested_category"] == "water_leakage"
    assert result["severity"] == "HIGH"

def test_api_classify_endpoint(client):
    res = client.post("/api/v1/ai/classify", data={"description": "குடிநீர் குழாய் உடைந்து தண்ணீர் வீணாகிறது"})
    assert res.status_code == 200
    data = res.json()
    assert data["suggested_category"] == "water_leakage"

def test_phash_hamming_identical():
    h1 = "8f8f0000ffff1111"
    h2 = "8f8f0000ffff1111"
    assert AIService.calculate_phash_hamming_distance(h1, h2) == 0

def test_phash_hamming_different():
    h1 = "0000000000000000"
    h2 = "ffffffffffffffff"
    assert AIService.calculate_phash_hamming_distance(h1, h2) == 64
