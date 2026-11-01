from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import get_mongo_client
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify MongoDB connection on startup
    try:
        client = get_mongo_client()
        client.admin.command("ping")
        print(f"[FastAPI] MongoDB connected: {settings.MONGODB_URI}")
    except Exception as e:
        print(f"[FastAPI] WARNING: MongoDB connection failed: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Civic Accountability Engine — AADHIRAI",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads storage
app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": "AADHIRAI FastAPI Backend",
        "version": settings.VERSION,
        "database": "MongoDB",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AADHIRAI Civic Accountability Engine",
        "database": "MongoDB",
        "version": settings.VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
