# AADHIRAI — Deployment & Operations Guide
## Production & Local Pilot Configuration

---

### 1. Prerequisites & System Requirements
- **Operating Systems**: Linux (Ubuntu 22.04 LTS / Debian 12), macOS, or Windows 11 with WSL2 / PowerShell.
- **Runtimes**:
  - Python 3.11+ (Python 3.14 compatible)
  - Node.js 20+ (v24.x compatible)
  - PostgreSQL 15+ with PostGIS 3.3+ (or SQLite with spatial polyfill for lightweight local dev)
  - Redis 7+
- **External API Keys (Optional for local mocks, required for live production)**:
  - `GEMINI_API_KEY`: Google Gemini API key
  - `IMD_API_KEY`: IMD Weather API token
  - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: S3 / MinIO storage

---

### 2. Environment Variables Specification (`.env.example`)
```env
# Application Core
ENVIRONMENT=development
PROJECT_NAME="AADHIRAI"
SECRET_KEY=change-this-to-a-cryptographically-secure-random-64-char-string
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database (PostgreSQL + PostGIS)
DATABASE_URL=postgresql+asyncpg://aadhirai_user:aadhirai_password@localhost:5432/aadhirai_db
DATABASE_SYNC_URL=postgresql://aadhirai_user:aadhirai_password@localhost:5432/aadhirai_db
# Local SQLite fallback option:
# DATABASE_URL=sqlite+aiosqlite:///./aadhirai.db

# Redis & Background Tasks
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Object Storage (S3 / MinIO)
STORAGE_BACKEND=local # 'local' or 's3'
LOCAL_STORAGE_DIR=./storage_uploads
S3_ENDPOINT_URL=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET_NAME=aadhirai-evidence
S3_REGION=ap-south-1

# External APIs
GEMINI_API_KEY=
IMD_API_KEY=

# Pilot Geographic Bounds (Musiri, Tamil Nadu)
PILOT_TOWN_NAME="Musiri"
PILOT_DISTRICT="Tiruchirappalli"
PILOT_CENTER_LAT=10.9413
PILOT_CENTER_LON=78.4485
PILOT_DEFAULT_SRID=4326

# Public Proof Domain
PUBLIC_PORTAL_URL=http://localhost:3000
```

---

### 3. Containerized Setup (Docker Compose)
A standard production compose stack provides:
1. `aadhirai-db`: PostgreSQL 16 + PostGIS
2. `aadhirai-redis`: Redis 7 Alpine
3. `aadhirai-backend`: FastAPI ASGI server via Uvicorn
4. `aadhirai-celery-worker`: Background AI and SLA tasks
5. `aadhirai-celery-beat`: Periodic SLA reminder and escalation scheduler
6. `aadhirai-frontend`: Next.js production SSR
7. `aadhirai-nginx`: Reverse proxy with SSL termination and Gzip compression

---

### 4. Local Development Quickstart (Without Docker)

#### Step A: Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```
Backend will be available at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

#### Step B: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:3000`.
