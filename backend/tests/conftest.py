import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.core.seed import seed_database
from app.main import app

# In-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_database(db)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def citizen_token(client):
    res = client.post("/api/v1/auth/login", json={
        "phone": "+919876543210",
        "password": "Password123!"
    })
    return res.json()["access_token"]

@pytest.fixture
def officer_token(client):
    res = client.post("/api/v1/auth/login", json={
        "phone": "+919876543211",
        "password": "Password123!"
    })
    return res.json()["access_token"]

@pytest.fixture
def admin_token(client):
    res = client.post("/api/v1/auth/login", json={
        "phone": "+919876543212",
        "password": "Password123!"
    })
    return res.json()["access_token"]
