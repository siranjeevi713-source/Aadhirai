import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from preprocessing.image_processor import ImagePreprocessor
from inference.classifier import CivicClassifier

app = FastAPI(
    title="AADHIRAI AI Vision Service",
    version="2.0.0",
    description="Computer Vision & Deep Feature Classification Service for Civic Complaints"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "aadhirai-ml-service",
        "version": CivicClassifier.MODEL_VERSION
    }

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format.")
    
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    # 1. Safe preprocessing and quality evaluation
    preprocessed = ImagePreprocessor.preprocess_image(contents)
    
    # 2. Model inference
    result = CivicClassifier.classify(preprocessed)
    
    return result

if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 8001))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=False)

