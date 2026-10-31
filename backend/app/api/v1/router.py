from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.officer import router as officer_router
from app.api.v1.verification import router as verification_router
from app.api.v1.ai import router as ai_router
from app.api.v1.public_proof import router as public_proof_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(complaints_router)
api_router.include_router(officer_router)
api_router.include_router(verification_router)
api_router.include_router(ai_router)
api_router.include_router(public_proof_router)
api_router.include_router(analytics_router)
api_router.include_router(admin_router)
