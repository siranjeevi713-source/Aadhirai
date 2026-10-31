# AADHIRAI — Security, Privacy & Threat Model
## Production-Grade Hardening & Compliance

---

### 1. Threat Model & Security Posture

AADHIRAI operates at the intersection of government records, public infrastructure, and citizen grievances. The system enforces strict defense-in-depth principles:

| Threat Vector | Mitigation Strategy |
| :--- | :--- |
| **Grievance Tampering / False Closures** | Mandatory cryptographic perceptual image hashing, independent verification pipeline, and immutable audit logs. |
| **Citizen Privacy Leakage (PII)** | Strict privacy filtering on public proof endpoints; coordinates truncated to ~110m; phone/email never serialized in public responses. |
| **Unauthorized Escalation / Access** | Role-Based Access Control (RBAC) + Object-Level Authorization (officers can only mutate grievances within their designated ward/department). |
| **Denial of Service (DoS)** | FastAPI rate limiting (slowapi), file upload size caps (15MB for images, 50MB for video), and worker timeouts. |
| **Malicious Media Injection** | Server-side MIME magic byte validation (preventing polyglot executables masked as `.jpg`/`.png`), stripped EXIF on public display. |
| **SQL & Spatial Injection** | Parameterized queries via SQLAlchemy 2.0 ORM; GeoAlchemy2 geometry parsers for spatial points and polygons. |

---

### 2. Authentication & Authorization Architecture
1. **Password Hashing**:
   - Algorithms: `Argon2id` (preferred) or `bcrypt` with salt rounds $\ge 12$.
   - Passwords must meet OWASP standards (minimum 8 characters, requiring uppercase, lowercase, numbers, and symbols).
2. **JWT Token Lifecycle**:
   - Access tokens: Expire in 60 minutes.
   - Refresh tokens: Stored in HTTP-only, Secure, SameSite cookies with 7-day expiration.
   - Immediate revocation via Redis blacklist upon logout or privilege modification.
3. **Role-Based Access Control (RBAC)**:
   - `CITIZEN`: Create complaints, view own history, submit feedback, dispute resolution.
   - `FIELD_OFFICER`: View assigned ward tickets, generate work orders, upload resolution evidence.
   - `DEPARTMENT_ADMIN`: Reassign officers, evaluate disputed resolutions, configure department rules.
   - `SUPER_ADMIN`: Manage municipal jurisdictions, adjust SLA deadlines, review system audit trails.

---

### 3. Public Proof Privacy Standards
Under Indian Digital Personal Data Protection Act (DPDPA 2023) guidelines:
- **No Direct Identifiers**: Citizen names, phone numbers, email addresses, and residential street house numbers are strictly excluded from `/public/proof/*` responses.
- **Geographic Precision Blurring**: Exact complaint coordinates (e.g. `10.941295, 78.448123`) are rounded to 3 decimal places (`10.941, 78.448`) on the public map to represent the general vicinity without exposing private premises.
- **Internal Deliberations Redacted**: Internal officer notes, contractor cost estimates, and supervisor dispute reviews are restricted to authorized internal portals.

---

### 4. Media & Upload Security Policy
- Supported file types: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `audio/wav`, `audio/webm`.
- Size limits: 15MB for photos; 50MB for videos; 10MB for audio recordings.
- Validation: Every uploaded file is scanned for MIME signature (magic bytes) to verify its true file header matches its declared extension.
- Storage: Assets are written to S3/MinIO with private ACLs and served via short-lived signed URLs (or CDN cached public proof URLs for verified items only).

---

### 5. Audit Logging & Non-Repudiation
Every state mutation event writes an immutable entry into `audit_logs`:
- Timestamp (UTC)
- Actor User ID & IP Address
- Entity Name & Entity UUID
- Mutation Action (`CREATE`, `STATUS_CHANGE`, `OVERRIDE_VERIFICATION`, `ESCALATION_TRIGGER`)
- Previous State Snapshot vs New State Snapshot (JSONB)
