import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AADHIRAI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "aadhirai-super-secret-jwt-key-2026-tamiltight-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours for pilot

    # MongoDB (primary persistent database)
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/aadhirai")
    MONGODB_DB: str = os.getenv("MONGODB_DB", "aadhirai")

    # Object Storage
    STORAGE_DIR: Path = BASE_DIR / "storage_uploads"
    
    # Pilot Municipality Info (Musiri, Tamil Nadu)
    PILOT_TOWN: str = "Musiri"
    PILOT_DISTRICT: str = "Tiruchirappalli"
    PILOT_STATE: str = "Tamil Nadu"
    PILOT_CENTER_LAT: float = 10.9413
    PILOT_CENTER_LON: float = 78.4485
    
    # Public Base URL
    PUBLIC_BASE_URL: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:3000")
    
    # Gemini & Hugging Face Vision AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    HF_MODEL_REPO: str = os.getenv("HF_MODEL_REPO", "Aryansahay/Pothole")
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    ML_SERVICE_URL: str = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:8001")
    AI_REQUEST_TIMEOUT: int = int(os.getenv("AI_REQUEST_TIMEOUT", "30"))
    MAX_IMAGE_SIZE_MB: int = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
