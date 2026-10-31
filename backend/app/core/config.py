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
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR}/aadhirai_local.db"
    )
    # Fix for Postgres URLs from Neon / Supabase / Vercel Postgres:
    # SQLAlchemy requires 'postgresql://' instead of 'postgres://'
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
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
    
    # Gemini API Key (optional fallback)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
