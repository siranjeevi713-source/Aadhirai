# AADHIRAI Full Project Audit & Architecture Assessment

**Date**: November 1, 2026  
**Role**: Senior MERN Stack Architect, Full-Stack Developer, AI/ML Engineer, Security Auditor  
**Project**: AADHIRAI (Nammaoor AI) – Civic Accountability Engine

---

## 1. Executive Summary & Inventory

An exhaustive code audit of the repository (`d:\aadhrai`) was conducted. The current repository contains:
1. **Frontend**: Next.js 16 (React 19, TypeScript, Tailwind CSS, Turbopack) with 24 routes across citizen, officer, and municipal admin views.
2. **Backend**: Python 3.14 + FastAPI + SQLite (`aadhirai_local.db`) using SQLAlchemy 2.0 ORM.
3. **AI/ML Engine**: Inlined within `backend/app/services/ai_service.py` using PIL, NumPy, and ImageHash with a 3-stage heuristic classifier.
4. **Data Models**: Scoped exclusively to a single municipal pilot (Musiri Municipality, 24 wards, in Tiruchirappalli District).

---

## 2. Comprehensive Audit Matrix

| Area | Current Implementation | Problems Identified | Required Changes | Status |
|---|---|---|---|:---:|
| **Architecture** | Python FastAPI monolith with inlined AI service + Next.js frontend | Not MERN stack; AI service couples web API with CV heuristics; rigid single-municipality focus | Decouple into: (1) Node.js/Express MERN API, (2) Python FastAPI `ml-service`, (3) React + Vite SPA with React Router | PARTIALLY IMPLEMENTED |
| **Database** | SQLite file (`aadhirai_local.db`) via SQLAlchemy | Relational single-file database; lacks MongoDB Mongoose schemas, GeoJSON 2dsphere indexing, and document relationships | Migrate to MongoDB + Mongoose with 14 modular collections, GeoJSON points, and automatic fallback | NOT IMPLEMENTED |
| **Information Architecture** | 3 flat portals (`/citizen`, `/officer`, `/admin`) | Missing Super Admin global control, District Reviewer role, and District + Department scoped Department Admin | Implement 4-tier hierarchy: Public, Super Admin, Department Admin, District Reviewer, Citizen | PARTIALLY IMPLEMENTED |
| **Authentication & RBAC** | Custom JWT in Python FastAPI with `user_roles` SQLite join | Lacks dynamic district/department scoping; no Super Admin provisioning workflow for Admins/Reviewers | JWT + bcrypt in Express; strictly enforce role and district/department boundary middleware | IMPLEMENTED BUT NOT TESTED |
| **Super Admin** | Municipal Commissioner admin page (`/admin`) viewing ward complaints | Cannot create districts, cannot create departments, cannot provision Department Admins or Reviewers | Build full Super Admin controllers: District, Department, Admin, Reviewer, User, Routing Rules, and Budgets | NOT IMPLEMENTED |
| **Department Admin** | Generic `/officer` dashboard viewing ward complaints | No district + department scoping; cannot manage department staff, work orders, or review evidence | Implement Department Admin dashboard scoped strictly to `(assignedDistrictId, departmentId)` | PARTIALLY IMPLEMENTED |
| **District Reviewer** | Basic verification request table in `/admin/verification` | No independent Reviewer role or dashboard; no formal Approve/Reject/Request Evidence workflow | Implement dedicated District Reviewer portal with before/after comparison and audit logging | PARTIALLY IMPLEMENTED |
| **Citizen Portal** | `/citizen/submit`, `/citizen/complaints`, `/citizen/profile` | Hardcoded Musiri ward selector; does not support incident location vs home district routing | Support tourist grievance reporting (home district vs incident district) with GIS auto-detection | PARTIALLY IMPLEMENTED |
| **Routing Engine** | Hardcoded category-to-department Python dict in `routing_service.py` | Ignores incident district; fails when non-Musiri coordinates are provided; cannot be edited by Super Admin | Implement MongoDB-backed dynamic routing engine based on `(incidentDistrictId, confirmedCategory)` | PARTIALLY IMPLEMENTED |
| **AI/ML Vision** | 3-stage CV feature extraction in Python FastAPI | Highly accurate (100% on test dataset) but coupled directly into web backend; requires dedicated microservice | Move to standalone `ml-service/` on port 8001 with modular model interface and REST API | IMPLEMENTED AND VERIFIED |
| **Image Storage** | Local filesystem (`backend/storage_uploads/`) | Files stored directly on server without secure public URL serving or cloud object storage abstraction | Implement Multer-based secure file upload with MIME validation, dual-copy architecture, and static serving | IMPLEMENTED AND VERIFIED |

---

## 3. Feature Classification Breakdown

- **IMPLEMENTED AND VERIFIED**:
  - 3-stage computer vision feature extraction for potholes, garbage, water leaks, streetlights, and negative non-civic rejection (tested on 14 real images).
  - EXIF orientation transposition and safe RGB image normalization.
  - Test suite benchmark for civic defect detection.
  
- **IMPLEMENTED BUT NOT TESTED**:
  - Frontend internationalization (Tamil/English toggle).
  - Reference number generation sequence logic.

- **PARTIALLY IMPLEMENTED**:
  - Complaint lifecycle status transitions (missing `RESOLVED_PENDING_REVIEW` to `VERIFIED` transition by Reviewer).
  - Department routing (functional for Musiri wards, but lacks multi-district dynamic routing).
  - Public proof showcase (hardcoded mockup fallback when proof is not published).

- **NOT IMPLEMENTED**:
  - MERN Stack (Node.js + Express + MongoDB + Mongoose + React/Vite).
  - Super Admin global control (District creation, Department provisioning, Reviewer assignment, Budget tracking).
  - Separate District Reviewer authentication and verification dashboard.
  - Tourist incident routing (citizen home district != incident district).
  - Thunder Client API test collection.

- **BLOCKED**:
  - Standalone MongoDB native binary not in Windows system PATH.  
    *Remediation*: Embed zero-config persistent MongoDB runner (`mongodb-memory-server` with persistent storage directory or configurable `MONGODB_URI`).

---

## 4. Architectural Transformation Plan

To fulfill all requirements without breaking existing functionality:
1. **Preserve & Extract AI Service**: Package the verified computer vision engine into `ml-service/` with FastAPI running on port 8001.
2. **Build MERN Backend**: Create `backend/` with Node.js, Express, Mongoose, JWT, RBAC, and all 14 MongoDB collections.
3. **Build React + Vite Frontend**: Create `frontend/` containing all role-specific layouts (Public, Super Admin, Department Admin, District Reviewer, Citizen) with Axios and React Router.
4. **Seed Real Persistent Data**: Seed Tamil Nadu districts (Coimbatore, Salem, Chennai, Tiruchirappalli, Madurai, etc.), departments, categories, and sample accounts.
5. **Generate Thunder Client Collection**: Export complete API collection covering all operations.

