"""
MongoDB database client for AADHIRAI FastAPI backend.
Replaces SQLAlchemy/SQLite with pymongo for real persistent storage.
"""
from pymongo import MongoClient
from app.core.config import settings

_client: MongoClient = None

def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _client

def get_db():
    """Dependency for providing MongoDB database handle."""
    client = get_mongo_client()
    db = client[settings.MONGODB_DB]
    return db
