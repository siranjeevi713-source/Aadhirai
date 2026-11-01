import os
import uvicorn
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from inference.hf_detector import HFDetector
from inference.gemini_vision import GeminiVisionClient
from inference.hybrid_orchestrator import HybridOrchestrator, CATEGORY_DETAILS

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload and cache model weights at startup
    print("[Startup] Initializing Hugging Face CivicAi-YOLO11m-v1 Detector...")
    hf = HFDetector.get_instance()
    print(f"[Startup] HF Detector loaded: {hf.is_loaded}")
    
    print("[Startup] Initializing Google Gemini Vision Client...")
    gemini = GeminiVisionClient.get_instance()
    print(f"[Startup] Gemini Vision available: {gemini.is_available} (Model: {gemini.model_name})")
    
    yield
    print("[Shutdown] ML Service shutting down.")

app = FastAPI(
    title="AADHIRAI Hybrid AI Vision Service",
    version="3.0.0",
    description="Dual Model Civic Inspection: Hugging Face YOLO11m + Google Gemini Vision",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConfirmCategoryPayload(BaseModel):
    complaintId: Optional[str] = None
    originalCategory: str
    confirmedCategory: str
    reason: Optional[str] = None
    userId: Optional[str] = None

@app.get("/")
@app.get("/health")
@app.get("/api/ai/health")
def health_check():
    hf = HFDetector.get_instance()
    gemini = GeminiVisionClient.get_instance()
    return {
        "status": "healthy",
        "service": "aadhirai-hybrid-ai-service",
        "version": "3.0.0-hybrid-yolo-gemini",
        "models": {
            "huggingFace": {
                "name": HFDetector.MODEL_NAME,
                "loaded": hf.is_loaded,
                "repo": HFDetector.REPO_ID
            },
            "geminiVision": {
                "configured": gemini.is_available,
                "model": gemini.model_name
            }
        }
    }

@app.post("/analyze")
@app.post("/api/ai/analyze-image")
async def analyze_image_endpoint(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format (JPEG, PNG, WebP).")
    
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    MAX_BYTES = int(os.environ.get("MAX_IMAGE_SIZE_MB", 10)) * 1024 * 1024
    if len(contents) > MAX_BYTES:
        raise HTTPException(status_code=400, detail=f"Image size exceeds limit of {MAX_BYTES // (1024*1024)}MB.")

    # Run Hybrid Analysis
    raw_res = HybridOrchestrator.analyze(contents, mime_type=file.content_type)

    analysis = raw_res["analysis"]
    final_cat = analysis.get("finalCategory", "UNCLEAR")
    cat_meta = CATEGORY_DETAILS.get(final_cat, CATEGORY_DETAILS["OTHER"])

    # Build comprehensive response adhering to Section 5 schema while preserving backward-compatibility
    response = {
        "success": raw_res["success"],
        "analysis": analysis,
        "huggingFace": raw_res["huggingFace"],
        "gemini": raw_res["gemini"],
        "imageQuality": raw_res["imageQuality"],
        "suggestedDepartment": raw_res.get("suggestedDepartment"),
        "suggestedDepartmentId": raw_res.get("suggestedDepartmentId"),
        "latencyMs": raw_res.get("latencyMs"),

        # Backward compatibility fields for existing Express MERN & FastAPI controllers
        "isCivicIssue": analysis.get("isCivicIssue", True),
        "is_civic_issue": analysis.get("isCivicIssue", True),
        "predictedCategory": final_cat,
        "predicted_category": final_cat,
        "categoryNameTa": cat_meta.get("displayNameTa", ""),
        "category_name_ta": cat_meta.get("displayNameTa", ""),
        "confidence": analysis.get("confidence", 0.0),
        "confidence_score": analysis.get("confidence", 0.0),
        "quality": raw_res["imageQuality"].get("quality", "GOOD"),
        "image_quality": raw_res["imageQuality"].get("quality", "GOOD"),
        "isUnclear": analysis.get("decisionStatus") in ("LOW_CONFIDENCE", "CORRUPTED_INPUT") or final_cat == "UNCLEAR",
        "is_unclear": analysis.get("decisionStatus") in ("LOW_CONFIDENCE", "CORRUPTED_INPUT") or final_cat == "UNCLEAR",
        "explanation": analysis.get("explanation", ""),
        "issue_description": analysis.get("explanation", ""),
        "suggestedSeverity": analysis.get("severity", "MEDIUM"),
        "suggested_severity": analysis.get("severity", "MEDIUM"),
        "suggested_department": raw_res.get("suggestedDepartment"),
        "visual_indicators": analysis.get("visualEvidence", []),
        "requires_human_confirmation": analysis.get("needsCitizenConfirmation", True),
        "decision_status": analysis.get("decisionStatus", "UNKNOWN")
    }

    return response

@app.post("/api/ai/confirm-category")
def confirm_category_endpoint(payload: ConfirmCategoryPayload):
    """
    Log and validate citizen category confirmation without overwriting original AI prediction.
    """
    cat_details = CATEGORY_DETAILS.get(payload.confirmedCategory, CATEGORY_DETAILS["OTHER"])
    return {
        "success": True,
        "originalCategory": payload.originalCategory,
        "confirmedCategory": payload.confirmedCategory,
        "displayName": cat_details["displayName"],
        "displayNameTa": cat_details["displayNameTa"],
        "recalculatedDepartment": cat_details["defaultDepartment"],
        "recalculatedDepartmentId": cat_details["departmentCode"],
        "requiresReview": payload.originalCategory != payload.confirmedCategory,
        "message": "Citizen category confirmation recorded successfully."
    }

if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 8001))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=False)
