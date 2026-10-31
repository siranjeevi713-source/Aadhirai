# AADHIRAI (ஆதிரை)
## AI-Powered Civic Accountability Engine
> **"Complaints don't end at submit. They end at proof."**

---

### 1. Executive Overview
**AADHIRAI** is a production-grade, Tamil-first CivicTech and GovTech public accountability platform designed to transform grievance redressal from passive complaint filing into an evidence-driven, auditable, and transparent resolution pipeline.

- **Pilot Location**: Musiri Municipality, Tiruchirappalli District, Tamil Nadu, India.
- **Architectural Tenet**: Configurable multi-tier jurisdictional hierarchy (State → District → Municipality/Taluk → Ward/Panchayat) allowing frictionless horizontal scaling across Tamil Nadu and India.
- **Core Workflow Principle**:
  $$\text{REPORT} \longrightarrow \text{CLASSIFY} \longrightarrow \text{ROUTE} \longrightarrow \text{TRACK} \longrightarrow \text{ESCALATE} \longrightarrow \text{VERIFY} \longrightarrow \text{PUBLIC PROOF}$$

---

### 2. Core Problem Addressed
In traditional civic grievance portals:
1. **Misrouting**: Potholes, open drains, or electrical hazards often sit in wrong department queues for weeks.
2. **Citizen Blindness**: Lack of real-time SLA tracking and transparent updates breeds cynicism.
3. **Ghost Resolutions**: Officers close complaints with generic remarks or unverified claims.
4. **Duplicate Clutter**: High volume of overlapping complaints for a single burst pipe or pothole overwhelms field teams.
5. **No Independent Verification**: Citizens have no recourse when an issue is improperly marked resolved.

**AADHIRAI** enforces **cryptographic and computer-vision-backed proof of resolution**, ensuring complaints are only closed with verifiable before/after evidence, perceptual hash verification, and public transparency.

---

### 3. Dedicated User Portals
| Portal | Primary Audience | Key Responsibilities |
| :--- | :--- | :--- |
| **Citizen Portal** | Citizens of Musiri & Pilot Regions | Bilingual (Tamil/English) complaint submission with GPS/media, voice input, real-time SLA tracking, resolution dispute, and feedback. |
| **Officer Portal** | Ward Engineers & Dept Officers | Queue management, map-based route planning, work-order drafting, before/after resolution evidence upload, status transitions. |
| **Admin Portal** | Municipal Commissioners & District Collectors | Department and ward jurisdiction management, SLA policy configuration, audit trail inspection, performance metrics, and duplicate resolution. |
| **Public Proof Portal** | General Public & Media | Privacy-preserving, read-only proof pages verifying completed work with before/after photos, verification summaries, and verifiable QR codes. |

---

### 4. Hybrid AI/ML Engine
AADHIRAI avoids single-point AI failure by employing a hybrid architecture:
1. **External Multimodal AI (Google Gemini API)**: Description comprehension, bilingual Tamil/English contextual understanding, category recommendations, and work-order draft generation.
2. **Computer Vision & Custom ML (RDD2022 & TACO pipelines)**: Road damage (potholes, alligator cracking) and garbage density estimation via YOLO & OpenCV.
3. **Tamil Speech-to-Text (AI4Bharat IndicConformer)**: High-accuracy voice-to-text processing for rural accessibility.
4. **Intelligent Duplicate Detection**: PostGIS spatial radius + perceptual image hashing (pHash) + text similarity matching.
5. **Independent Resolution Verification**: Strict before/after visual difference analysis, perceptual hash uniqueness verification, metadata consistency, and citizen satisfaction checks.
   *(AI recommends; authorized human reviewers retain override accountability).*

---

### 5. Technology Stack
- **Frontend**: Next.js / React, TypeScript, Tailwind CSS, Lucide icons, Leaflet / OpenStreetMap.
- **Backend**: Python 3.14 / FastAPI, Pydantic v2 validation, SQLAlchemy 2.0 (async/sync models), Alembic.
- **Spatial Database**: PostgreSQL with PostGIS extension (with SQLite + SpatiaLite fallback for zero-dependency local runs).
- **Background Tasks & Caching**: Celery + Redis (with standalone in-process fallback engine for lightweight setups).
- **Security**: JWT tokens, argon2/bcrypt password hashing, RBAC, strict CORS, rate limiting, and zero exposure of PII on public proof pages.

---

### 6. Directory Structure
```text
aadhrai/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/v1/           # Modular REST API endpoints
│   │   ├── core/             # Configuration, security, RBAC, logging
│   │   ├── models/           # SQLAlchemy ORM models (Spatial + Relational)
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   ├── services/         # Business logic (AI, Routing, Verification, SLA)
│   │   └── integrations/     # Gemini, IMD Weather, OSM, AI4Bharat
│   ├── tests/                # Automated pytest suite
│   └── alembic/              # Database migration versions
├── frontend/                 # Next.js / React Client
│   ├── src/
│   │   ├── app/              # Next.js App Router (Citizen, Officer, Admin, Proof)
│   │   ├── components/       # Accessible UI design system
│   │   ├── lib/              # API clients, i18n dictionaries (ta/en)
│   │   └── types/            # TypeScript interfaces
├── docs/                     # Engineering documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_DOCUMENTATION.md
│   ├── SECURITY.md
│   └── DEPLOYMENT.md
├── docker/                   # Container orchestration configs
├── DEVELOPMENT_STATUS.md     # Phase-wise implementation tracker
└── CHANGELOG.md              # Version audit log
```

---

### 7. Pilot Deployment Context: Musiri Municipality
- **District**: Tiruchirappalli, Tamil Nadu
- **Wards**: 24 Municipal Wards
- **Key Departments**: Roads & Highways, Public Health & Sanitation, Water Supply & Drainage, Streetlighting & Electrical, Town Planning.
