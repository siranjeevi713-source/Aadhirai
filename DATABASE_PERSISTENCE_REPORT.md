# AADHIRAI Database Persistence & Schema Integrity Audit

**RDBMS**: SQLite (Local Dev) / PostgreSQL (Neon / Supabase on Vercel)  
**ORM**: SQLAlchemy 2.0 with declarative base  
**Database**: `backend/app/db/` & `backend/app/models/`  

---

## 1. Schema Architecture & Verification

The database schema enforces relational integrity across 12 core tables:

1. `users`: Citizens, Officers, and Admins with bcrypt hashed credentials and unique mobile number / email constraints.
2. `roles` & `user_roles`: Many-to-many role binding supporting fine-grained RBAC (`citizen`, `officer`, `admin`).
3. `departments`: 6 Musiri municipal wings with code, name (Tamil and English), and head officer reference.
4. `wards`: 24 Musiri municipal wards with boundary definitions and population statistics.
5. `complaints`: Master grievance record with UUID primary key, human-readable reference number (`ADH-YYYY-MSR-XXXX`), GPS coordinates (latitude, longitude), address, category, status, and SLA deadline.
6. `complaint_images`: Evidence storage references, preserving original image URI, analysis copy URI, and EXIF metadata.
7. `ai_analysis_records`: Full diagnostic log of AI vision inference, recording detected category, secondary candidates, confidence scores, visual indicators, and raw model output.
8. `complaint_history`: Immutable event timeline capturing transitions (`SUBMITTED` $\to$ `ASSIGNED` $\to$ `IN_PROGRESS` $\to$ `RESOLVED` $\to$ `VERIFIED_RESOLVED`).
9. `verification_records`: Human supervisor verification decisions with before/after photo comparison, GPS proximity validation, and remarks.
10. `officer_profiles`: Department assignment and active caseload tracking.
11. `notifications`: In-app SMS/alert records for citizens and officers.
12. `audit_logs`: Administrative change tracking with user ID, IP address, and payload delta.

---

## 2. Integrity Tests & Validation Rules

- **Reference Number Uniqueness**: Generated using atomic sequence format `ADH-{YEAR}-MSR-{SEQ:04d}` with collision retry guards.
- **Foreign Key Enforcement**: Enabled via SQLite `PRAGMA foreign_keys = ON;` in development and enforced by native PostgreSQL constraints in production.
- **ACID Transaction Boundaries**: All complaint submission operations wrap image record creation, AI diagnostic logging, routing calculation, and event creation inside a single `db.begin()` transaction block. If image persistence or analysis fails, the transaction rolls back cleanly.
- **No Mock Persistence**: Real database rows are written to disk; `SELECT` queries verify data retention across server restarts.
