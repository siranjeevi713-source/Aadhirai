# AADHIRAI – AI Image Detection Audit Report

## 1. Audit Findings & Root Cause Analysis
Prior to this remediation, an audit of the image analysis pipeline identified the following issues:
1. **Frontend-Backend Endpoint Disconnect**: The submission form at `src/app/citizen/submit/page.tsx` called `/ai/classify-image` sending multipart FormData, whereas the backend only implemented `/ai/classify` which expected a text form field `description`.
2. **Missing Multimodal Image Inspection**: The backend `AIService.classify_grievance` only parsed keyword substrings from user text input. If no description was typed, it fell back to a default state regardless of the uploaded image bytes.
3. **Static Department Assumption**: When the user overrode a category, the department suggestion was not dynamically recalculated against the backend routing rules.

## 2. Changes Implemented
- **Multimodal AI Architecture**: Implemented dual-engine analysis in `backend/app/services/ai_service.py`:
  - **Gemini Multimodal API (`gemini-2.5-flash`)**: Used when `GEMINI_API_KEY` is present in the environment.
  - **Computer Vision Decision Engine**: High-performance local fallback using Pillow and NumPy that analyzes image spectral metrics (dark ratio, edge energy, luminance gradient, color spectrum).
- **Dedicated Inspection Endpoints**: Added `POST /api/v1/ai/analyze-civic-image` and `POST /api/v1/ai/classify-image` in `backend/app/api/v1/ai.py` returning canonical categories (`POTHOLE`, `GARBAGE_ACCUMULATION`, `DRAINAGE_BLOCKAGE`, `WATER_LEAKAGE`, `BROKEN_STREETLIGHT`, `UNCLEAR_OR_UNDETECTABLE`).
- **Dynamic Routing Recalculation**: Added `GET /api/v1/routing/suggestions` to recalculate the assigned department dynamically whenever a citizen selects a different category.

