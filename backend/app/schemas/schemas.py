from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- Auth & User ---
class UserRegister(BaseModel):
    phone: str = Field(..., example="+919876543210")
    full_name: str = Field(..., example="செந்தில் குமார் (Senthil Kumar)")
    password: str = Field(..., min_length=6)
    email: Optional[str] = None
    preferred_language: str = Field("ta", example="ta")

class UserLogin(BaseModel):
    phone: Optional[str] = None
    identifier: Optional[str] = None
    password: str
    expected_role: Optional[str] = None
    expected_department_id: Optional[str] = None



class RoleSchema(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class OfficerProfileResponse(BaseModel):
    id: str
    badge_number: str
    designation: str
    department_id: str
    is_on_duty: bool

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    phone: str
    email: Optional[str] = None
    full_name: str
    preferred_language: str
    is_active: bool
    roles: List[RoleSchema] = []
    officer_profile: Optional[OfficerProfileResponse] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Categories & Wards & Departments ---
class CategoryResponse(BaseModel):
    id: str
    code: str
    name_en: str
    name_ta: str
    default_priority: str
    icon_key: str
    is_active: bool

    class Config:
        from_attributes = True

class CategoryCreate(BaseModel):
    code: str
    name_en: str
    name_ta: str
    default_priority: str = "MEDIUM"
    icon_key: str = "alert-circle"

class WardResponse(BaseModel):
    id: str
    ward_number: int
    name_en: str
    name_ta: str
    center_lat: float
    center_lon: float

    class Config:
        from_attributes = True

class DepartmentResponse(BaseModel):
    id: str
    code: str
    name_en: str
    name_ta: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

    class Config:
        from_attributes = True

# --- Evidence ---
class EvidenceResponse(BaseModel):
    id: str
    phase: str
    media_type: str
    file_url: str
    mime_type: str
    file_size_bytes: int
    perceptual_hash: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

# --- Complaints ---
class ComplaintCreate(BaseModel):
    title: str
    description: str
    category_id: Optional[str] = None
    latitude: float
    longitude: float
    address_text: Optional[str] = None
    landmark: Optional[str] = None
    language: str = "ta"
    priority: str = "MEDIUM"

class ComplaintListItem(BaseModel):
    id: str
    public_reference: str
    title: str
    category: CategoryResponse
    status: str
    priority: str
    latitude: float
    longitude: float
    address_text: Optional[str] = None
    ward_name: Optional[str] = None
    department_name: Optional[str] = None
    due_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WorkOrderResponse(BaseModel):
    id: str
    order_number: str
    title: str
    action_plan: str
    estimated_cost: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class VerificationResponse(BaseModel):
    id: str
    status: str
    ai_visual_delta_score: float
    phash_match_detected: bool
    gps_distance_delta_meters: float
    audit_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FeedbackResponse(BaseModel):
    id: str
    rating: int
    comments: Optional[str] = None
    is_disputed: bool
    dispute_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintDetailResponse(BaseModel):
    id: str
    public_reference: str
    title: str
    description: str
    language: str
    priority: str
    status: str
    latitude: float
    longitude: float
    address_text: Optional[str] = None
    landmark: Optional[str] = None
    category: CategoryResponse
    ward: Optional[WardResponse] = None
    assigned_department: Optional[DepartmentResponse] = None
    assigned_officer_name: Optional[str] = None
    ai_suggested_category: Optional[str] = None
    ai_confidence: float = 0.0
    requires_human_review: bool = False
    due_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    evidence: List[EvidenceResponse] = []
    work_orders: List[WorkOrderResponse] = []
    verification: Optional[VerificationResponse] = None
    feedback: Optional[FeedbackResponse] = None

    class Config:
        from_attributes = True

# --- Officer Actions ---
class CreateWorkOrderRequest(BaseModel):
    title: str
    action_plan: str
    estimated_cost: float = 0.0

class ResolveComplaintRequest(BaseModel):
    officer_notes: str
    resolution_cost: Optional[float] = 0.0

# --- Verification & Disputes ---
class VerificationReviewRequest(BaseModel):
    action: str = Field(..., example="APPROVE") # APPROVE or REJECT
    justification: str

class DisputeRequest(BaseModel):
    reason: str

class FeedbackRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None

# --- AI & Duplicates ---
class AIClassifyRequest(BaseModel):
    description: Optional[str] = None
    image_url: Optional[str] = None

class AIClassifyResponse(BaseModel):
    suggested_category: str
    detected_objects: List[Dict[str, Any]] = []
    severity: str
    confidence: float
    reason: str
    requires_human_review: bool

class CivicImageAnalysisResponse(BaseModel):
    predicted_category: str
    category_id: Optional[str] = None
    category_name: str
    confidence: float
    confidence_score: float
    severity: str
    suggested_severity: str
    issue_description: str
    reason: str
    visual_indicators: List[str] = []
    suggested_department: str
    suggested_department_id: Optional[str] = None
    image_quality: str
    uncertainty_reason: Optional[str] = None
    requires_human_confirmation: bool
    requires_human_review: bool
    provider_used: str

class DuplicateCheckRequest(BaseModel):
    latitude: float
    longitude: float
    category_id: str
    description: Optional[str] = None
    perceptual_hash: Optional[str] = None

class DuplicateMatch(BaseModel):
    complaint_id: str
    public_reference: str
    title: str
    similarity_score: float
    distance_meters: float

# --- Public Proof ---
class PublicProofResponse(BaseModel):
    public_reference: str
    category_name: str
    approximate_lat: float
    approximate_lon: float
    ward_name: str
    submitted_date: datetime
    resolved_date: datetime
    turnaround_hours: float
    before_image_url: str
    after_image_url: str
    verification_summary: str
    qr_code_url: Optional[str] = None
    published_at: datetime

    class Config:
        from_attributes = True

# --- Analytics ---
class AnalyticsOverviewResponse(BaseModel):
    total_complaints: int
    pending_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    reopened_complaints: int
    escalated_complaints: int
    sla_compliance_rate: float
    average_resolution_hours: float

class WardStatResponse(BaseModel):
    ward_number: int
    ward_name: str
    complaint_count: int
    resolved_count: int

class DepartmentStatResponse(BaseModel):
    department_name: str
    total_assigned: int
    resolved_count: int
    compliance_rate: float

class HotspotItem(BaseModel):
    category_name: str
    latitude: float
    longitude: float
    incident_count: int
    severity: str
