# AADHIRAI — REST API Specification
## Version 1.0 (OpenAPI 3.1 Compatible)

Base URL: `/api/v1`

---

### 1. Global Conventions & Authentication
- **Headers**:
  - `Authorization: Bearer <JWT_ACCESS_TOKEN>`
  - `Accept-Language: ta` or `en` (defaults to user preference or `ta`)
  - `Content-Type: application/json` (or `multipart/form-data` for uploads)
- **Standard Error Response**:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Complaint ADH-2026-MSR-0084 does not exist",
    "details": {},
    "timestamp": "2026-10-31T10:45:00Z"
  }
}
```

---

### 2. Authentication & Identity (`/api/v1/auth`)

#### `POST /auth/register`
- **Role**: Public
- **Request Body**:
```json
{
  "phone": "+919876543210",
  "full_name": "செந்தில் குமார் (Senthil Kumar)",
  "password": "SecurePassword123!",
  "preferred_language": "ta"
}
```
- **Response**: `201 Created`
```json
{
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "roles": ["citizen"]
}
```

#### `POST /auth/login`
- **Role**: Public
- **Request**: `phone`, `password`
- **Response**: `200 OK` (token, user details, assigned role)

#### `GET /auth/me`
- **Role**: Authenticated
- **Response**: Current user profile, language preferences, active roles.

---

### 3. Complaints & Grievance Lifecycle (`/api/v1/complaints`)

#### `POST /complaints`
- **Role**: Citizen, Super Admin
- **Request (Multipart/Form-Data)**:
  - `title`: string
  - `description`: string (Tamil or English)
  - `category_code`: string (optional if AI categorizes)
  - `latitude`: float
  - `longitude`: float
  - `address_text`: string
  - `evidence_file`: file (image/video, required)
  - `audio_voice_file`: file (optional Tamil audio)
- **Response**: `201 Created`
```json
{
  "id": "e4b3c2a1-0000-4000-8000-123456789abc",
  "public_reference": "ADH-2026-MSR-0084",
  "status": "SUBMITTED",
  "ai_suggestion": {
    "suggested_category": "road_damage",
    "confidence": 0.94,
    "severity": "HIGH",
    "requires_human_review": false
  },
  "assigned_ward": "Ward 7 - Kavery Nagar, Musiri",
  "sla_deadline": "2026-11-03T10:45:00Z"
}
```

#### `GET /complaints`
- **Role**: Authenticated (Scoped by role: citizen sees own; officer sees department/ward; admin sees all)
- **Query Params**: `status`, `category`, `ward_id`, `page`, `page_size`

#### `GET /complaints/{id}`
- **Role**: Authenticated
- **Response**: Complete complaint details, timeline history, evidence list, current SLA status.

---

### 4. AI & Multimodal Intelligence (`/api/v1/ai`)

#### `POST /ai/classify`
- **Role**: Authenticated / Internal Service
- **Request**: Image bytes / S3 URL + Optional text description
- **Response**:
```json
{
  "suggested_category": "garbage_accumulation",
  "detected_objects": [
    {"label": "waste_plastic", "confidence": 0.89, "bbox": [120, 80, 450, 600]}
  ],
  "severity": "HIGH",
  "confidence": 0.91,
  "reason": "Large municipal solid waste pile obstructing pedestrian path near drain.",
  "requires_human_review": false
}
```

#### `POST /ai/duplicate-check`
- **Request**: `latitude`, `longitude`, `category_code`, `perceptual_hash`
- **Response**: List of candidate matching complaints within 100m radius with similarity score.

---

### 5. Officer Operations (`/api/v1/officer`)

#### `GET /officer/assignments`
- **Role**: Officer, Dept Admin
- **Query Params**: `due_urgency`, `ward_id`
- **Response**: Active assigned complaint cards with GPS coordinates and SLA countdown.

#### `POST /officer/complaints/{id}/accept`
- **Role**: Assigned Officer
- **Response**: Status transitions to `IN_PROGRESS`, work-order draft initialized.

#### `POST /officer/complaints/{id}/resolve`
- **Role**: Assigned Officer
- **Request (Multipart)**:
  - `resolution_evidence_file`: image file (Required)
  - `officer_notes`: string
  - `work_order_cost`: float (optional)
  - `completion_timestamp`: datetime
- **Response**: Triggers verification pipeline; returns verification score and status `RESOLVED_PENDING_VERIFICATION` or `VERIFIED_RESOLVED`.

---

### 6. Evidence Verification Engine (`/api/v1/verification`)

#### `GET /verification/{complaint_id}`
- **Role**: Officer, Citizen, Admin
- **Response**: Before and After evidence side-by-side, perceptual hash similarity metrics, AI visual delta evaluation, and audit history.

#### `POST /verification/{complaint_id}/review`
- **Role**: Dept Admin / Municipal Engineer
- **Request**: `action` ("APPROVE", "REJECT"), `justification`: string
- **Response**: Overrides AI recommendation with recorded audit log.

#### `POST /verification/{complaint_id}/dispute`
- **Role**: Complaint Owner (Citizen)
- **Request**: `reason`: string, `dispute_evidence_file`: optional file
- **Response**: Transitions complaint to `DISPUTED`, immediately triggers Escalation Level 2.

---

### 7. Public Proof & Open Governance (`/api/v1/public`)

#### `GET /public/proof/{public_reference}`
- **Role**: Public (No auth required)
- **Privacy Guarantees**:
  - No citizen name, phone, or email.
  - Coordinate precision clamped to 3 decimal places (~110m ward sector).
  - No internal department notes.
- **Response**:
```json
{
  "public_reference": "ADH-2026-MSR-0084",
  "category": "Road Damage / Pothole Repair",
  "location": "Ward 7, Musiri Municipality",
  "approx_coordinates": [10.941, 78.448],
  "submitted_at": "2026-10-28T09:15:00Z",
  "resolved_at": "2026-10-30T14:30:00Z",
  "turnaround_hours": 53.2,
  "before_evidence_url": "https://storage.aadhirai.tn.gov.in/public/ADH-0084-before.webp",
  "after_evidence_url": "https://storage.aadhirai.tn.gov.in/public/ADH-0084-after.webp",
  "verification_status": "VERIFIED_RESOLVED",
  "verification_audit_summary": "Passed dual-hash tamper check, GPS proximity within 12m, and verified via computer vision asphalt patch detection.",
  "qr_verification_url": "https://aadhirai.tn.gov.in/proof/ADH-2026-MSR-0084"
}
```

---

### 8. Analytics & Civic Intelligence (`/api/v1/analytics`)

#### `GET /analytics/overview`
- Live metrics: Total complaints, verified rate %, SLA compliance %, average resolution turnaround, ward hotspot rankings.
- *Strictly computed from database queries with zero hardcoded values.*
