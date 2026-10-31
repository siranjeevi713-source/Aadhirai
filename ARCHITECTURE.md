# AADHIRAI — System Architecture Specification
## AI-Powered Civic Accountability Engine

---

### 1. Architectural Philosophy & Core Tenets

AADHIRAI is engineered on six non-negotiable architectural tenets:
1. **Evidence-Driven Finality**: No grievance ticket can transition to `VERIFIED_RESOLVED` purely through bureaucratic sign-off. It requires verifiable computer-vision and human-audited proof (before/after imagery, timestamp/coordinate coherence, perceptual hash matching).
2. **Deterministic Jurisdiction Routing**: While AI assists in categorization and text interpretation, **geospatial routing is 100% deterministic, explainable, and rule-governed** using PostGIS spatial boundaries and administrative ward tables.
3. **AI as Advisor, Not Autocrat**: Machine learning models (Gemini multimodal, YOLO RDD2022, TACO) provide recommendations and confidence scores. Uncertain predictions or critical anomalies trigger human review workflows.
4. **Tamil-First Accessibility**: Equal digital parity for Tamil and English users across UI, voice transcription (IndicConformer), and notification messaging.
5. **Zero-PII Public Proof**: Public transparency must never jeopardize citizen privacy. All public proof artifacts are rigorously sanitized of names, phone numbers, exact residential coordinates, and internal remarks.
6. **Resilient Degradation**: System operation persists cleanly even if third-party APIs (Gemini, IMD weather, external SMS gateways) experience network or quota outages.

---

### 2. High-Level System Architecture

```mermaid
graph TD
    subgraph Clients ["Client Layer (Next.js / TypeScript / Tailwind)"]
        CP[Citizen Portal\nTamil/English Mobile-First]
        OP[Officer Portal\nField & Desktop Triage]
        AP[Admin & Analytics Portal\nCommand & Policy]
        PP[Public Proof Portal\nRead-Only Privacy-Filtered]
    end

    subgraph Gateway ["API Gateway & Security Layer"]
        REV[Nginx Reverse Proxy / SSL Termination]
        RAT[Rate Limiter & CORS Guard]
        AUTH[JWT / RBAC Security Middleware]
    end

    subgraph Backend ["FastAPI Application (Modular Monolith)"]
        API_AUTH[Auth & Profile Module]
        API_COMP[Complaint Submission & Lifecycle]
        API_AI[AI Orchestration & Ingestion]
        API_ROUTE[Geographic & Routing Engine]
        API_VERIF[Independent Verification Engine]
        API_SLA[SLA & Escalation Engine]
        API_PUB[Public Proof Engine]
        API_ANALYTICS[Ward & Dept Analytics]
    end

    subgraph AI_Engine ["AI & Machine Learning Services"]
        GEMINI[Google Gemini 1.5/2.0 API\nMultimodal Classification & Work Orders]
        YOLO_RDD[YOLO RDD2022\nRoad Damage Detection]
        YOLO_TACO[YOLO TACO\nGarbage Accumulation Detection]
        ASR[AI4Bharat IndicConformer\nTamil Voice Transcription]
        CV_HASH[OpenCV & ImageHash\npHash & Duplicate Comparison]
        SENT_TRANS[Sentence Transformers\nSemantic Duplicate Detection]
    end

    subgraph Data_Layer ["Persistent & Spatial Data Layer"]
        PG[(PostgreSQL + PostGIS\nSpatial Indexing & RDBMS)]
        REDIS[(Redis Cache & Celery Broker)]
        OBJ_STORE[(S3 / MinIO Object Storage\nMedia & Proof Assets)]
    end

    subgraph Ext_Integrations ["External Civic Services"]
        OSM[OpenStreetMap / Overpass API]
        IMD[IMD Official Weather API]
        NOTIF[Notification Gateway - SMS/Email]
    end

    %% Connections
    Clients --> REV --> RAT --> AUTH
    AUTH --> Backend
    Backend --> Data_Layer
    API_AI --> AI_Engine
    API_ROUTE --> OSM
    API_ANALYTICS --> IMD
    API_SLA --> NOTIF
```

---

### 3. Detailed Data-Flow & Complaint Lifecycle

The core accountability lifecycle follows strict state transitions:

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED: Citizen submits complaint with GPS & Photo/Video
    
    SUBMITTED --> AI_PROCESSING: Background Worker triggers Hybrid AI
    AI_PROCESSING --> DUPLICATE_CHECK: pHash + Semantic + Spatial Radius
    
    DUPLICATE_CHECK --> LINKED_DUPLICATE: High similarity threshold (>85%)
    DUPLICATE_CHECK --> ROUTING_EVALUATION: Unique or authorized independent issue
    
    ROUTING_EVALUATION --> ASSIGNED: Matched with Ward Boundary & Dept Routing Rule
    ROUTING_EVALUATION --> NEEDS_ADMIN_REVIEW: Unmatched boundary or ambiguous category
    
    NEEDS_ADMIN_REVIEW --> ASSIGNED: Admin manually overrides department & officer
    
    ASSIGNED --> IN_PROGRESS: Field Officer accepts & drafts Work Order
    ASSIGNED --> ESCALATED_L1: SLA Breached without officer acceptance
    
    IN_PROGRESS --> RESOLUTION_SUBMITTED: Officer submits After-Repair Photo + Remarks
    IN_PROGRESS --> ESCALATED_L2: SLA Breached during active repair
    
    RESOLUTION_SUBMITTED --> VERIFICATION_PIPELINE: AI visual inspection + pHash comparison
    
    VERIFICATION_PIPELINE --> VERIFIED: Evidence passed confidence (>80%) & Citizen approves
    VERIFICATION_PIPELINE --> NEEDS_HUMAN_REVIEW: Metadata anomaly or visual ambiguity
    VERIFICATION_PIPELINE --> DISPUTED: Citizen rejects resolution within 72h
    
    NEEDS_HUMAN_REVIEW --> VERIFIED: Superintending Engineer approves with audit log
    NEEDS_HUMAN_REVIEW --> REOPENED: Superintending Engineer rejects officer claim
    DISPUTED --> REOPENED: Auto-escalated to Executive Officer
    REOPENED --> IN_PROGRESS: Rework ticket assigned
    
    VERIFIED --> PUBLIC_PROOF_PUBLISHED: Read-only QR code & Proof card generated
    PUBLIC_PROOF_PUBLISHED --> [*]
```

---

### 4. AI & Machine Learning Pipeline

```mermaid
flowchart LR
    subgraph Input
        IMG[Citizen Image/Video]
        TXT[Tamil/English Description]
        LOC[GPS Coordinates]
    end

    subgraph Hybrid_Classifier
        GEM[Gemini Vision API]
        YOLO[Local YOLO RDD/TACO]
        PHASH[ImageHash pHash Generator]
        EMB[Semantic Text Embeddings]
    end

    subgraph Consensus_Validator
        VAL{Pydantic Schema Validation}
        CONF{Confidence > 75%?}
    end

    subgraph Output
        SUGG[Suggested Category & Severity]
        REVIEW[Flagged for Human Review]
        DUP[Duplicate Link Candidate]
    end

    IMG --> GEM
    IMG --> YOLO
    IMG --> PHASH
    TXT --> GEM
    TXT --> EMB

    GEM --> VAL
    YOLO --> VAL
    VAL --> CONF
    CONF -- Yes --> SUGG
    CONF -- No --> REVIEW
    PHASH & EMB --> DUP
```

---

### 5. Independent Evidence Verification Architecture

Verification is the differentiator of AADHIRAI:
1. **Perceptual Image Hashing (`dhash` + `phash`)**:
   - Detects whether the officer re-uploaded the original "before" image, a stock image from the web, or an image from another ward.
   - Hamming distance $< 5$ between before and after images immediately flags `FRAUD_ALERT_DUPLICATE_IMAGE`.
2. **Spatial & Temporal Coherence**:
   - Compares the EXIF/upload coordinates of the resolution photo with the complaint origin point.
   - Flags delta $> 150$ meters for manual review.
3. **Multimodal Visual Delta Analysis**:
   - Gemini Vision and OpenCV contour difference assess structural state change (e.g. pothole asphalt patch visible, garbage heap absent, illuminated street light).
4. **Citizen Confirmation Window**:
   - 72-hour citizen verification grace period. If citizen marks `DISPUTED`, status triggers escalation to higher municipal authority.

---

### 6. Deployment Architecture

```mermaid
graph TB
    subgraph Cloud_or_OnPrem ["Container Host (Production / Pilot Environment)"]
        subgraph Ingress
            NGINX[Nginx 1.25 Reverse Proxy / Static Cache]
        end
        subgraph App_Containers
            FE[Next.js Production SSR Node Service :3000]
            BE[FastAPI Uvicorn Async Workers :8000]
            CW[Celery Background Workers]
            CB[Celery Beat Periodic SLA Scheduler]
        end
        subgraph Storage_Containers
            PGBOUND[PostgreSQL 16 + PostGIS 3.4 :5432]
            REDIS_INST[Redis 7 Alpine Cache & Broker :6379]
            MINIO[MinIO / S3 Object Storage :9000]
        end
    end

    Internet((Citizens & Officers)) --> NGINX
    NGINX --> FE
    NGINX --> BE
    BE --> PGBOUND
    BE --> REDIS_INST
    BE --> MINIO
    CW --> PGBOUND
    CW --> REDIS_INST
    CW --> MINIO
    CB --> REDIS_INST
```
