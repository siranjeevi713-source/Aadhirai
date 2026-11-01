# AADHIRAI Image Upload & Preprocessing Failure Audit Report

**Municipal Pilot**: Musiri Municipality, Tiruchirappalli District, Tamil Nadu  
**Audit Scope**: End-to-end inspection of Citizen image capture, upload transport, MIME/magic byte validation, EXIF normalization, and storage persistence.

---

## 1. Executive Summary

During multi-device and multi-format testing across desktop and mobile browsers, 4 specific failure modes were identified in the image handling pipeline:
1. **Double Stream Consumption in Next.js Client**: `client.ts` attempted `response.json()` followed by `response.text()` on non-200 responses, causing `TypeError: Failed to execute 'text' on 'Response': body stream already read`.
2. **Missing EXIF Orientation Normalization**: Portrait smartphone captures (EXIF orientation 6 or 8) were previously uploaded without transposition, resulting in 90-degree sideways orientation when passed to computer vision algorithms.
3. **MIME/Extension Mismatch on WEBP/HEIC**: File inputs accepting modern mobile formats were failing MIME type validation on the backend if headers differed from magic bytes.
4. **Large File Upload Exhaustion**: High-resolution mobile images (>8MB) caused request timeouts when processed in memory on resource-constrained environments.

---

## 2. Pipeline Trace & Inspection Points

```
[Citizen Camera / Gallery]
           │
           ▼
[Frontend Validation] ──▶ File size (<10MB), MIME check (JPEG, PNG, WEBP)
           │
           ▼
[Multipart/form-data] ──▶ Cached stream read in frontend/src/lib/api/client.ts
           │
           ▼
[FastAPI Backend /ai/analyze] ──▶ Magic byte validation (PIL Image.open)
           │
           ▼
[Safe Preprocessing] ──▶ PIL.ImageOps.exif_transpose() corrects orientation
           │
           ▼
[Dual Copy Architecture]:
    ├─ Original Evidence File: Saved intact without compression (Audit Proof)
    └─ Analysis Copy: Resized to max 1024x1024, RGB normalized for Computer Vision
           │
           ▼
[AI Vision Inference] ──▶ Features extracted from normalized analysis copy
```

---

## 3. Failure Modes, Root Causes & Implemented Fixes

| Failure Mode | Root Cause | Impact | Fix Implemented |
|---|---|---|---|
| **Stream Already Read** | Frontend `client.ts` called `.json()` then `.text()` on error | Citizen sees raw stream error instead of API message | Cloned / text-first reading with try/catch JSON parse |
| **Rotated Smartphone Images** | Missing EXIF transposition in CV preprocessing | Potholes and streetlights had rotated coordinate axes | Added `PIL.ImageOps.exif_transpose()` before feature analysis |
| **RGBA PNG Channel Crash** | 4-channel PNGs caused color matrix math exceptions | HTTP 500 error on transparent PNG uploads | Added `.convert("RGB")` conversion prior to numpy array processing |
| **Evidence Overwriting** | Preprocessing in-place modified the citizen's original photo | Potential evidence tampering risk in audit trails | Strict separation: original byte buffer saved to disk, separate resized array used for inference |

---

## 4. Format Verification Results

- **JPEG / JPG**: Verified (RGB, 8-bit, with/without EXIF).
- **PNG**: Verified (RGB and RGBA transparent converted to white background).
- **WEBP**: Verified (Lossy and Lossless).
- **Corrupted / Truncated Files**: Rejected gracefully with HTTP 400 (`Invalid image data: cannot identify image file`).
- **Oversized Files (>10MB)**: Rejected at client boundary and FastAPI `UploadFile` size guard with HTTP 413.

