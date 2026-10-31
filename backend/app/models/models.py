import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, Table
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

# User-Role Association
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
)

class Role(Base):
    __tablename__ = "roles"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False) # 'citizen', 'officer', 'admin'
    description = Column(String(255), nullable=True)

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    full_name = Column(String(150), nullable=False)
    password_hash = Column(String(255), nullable=False)
    preferred_language = Column(String(10), default="ta") # 'ta' or 'en'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    roles = relationship("Role", secondary=user_roles, backref="users", lazy="joined")
    officer_profile = relationship("Officer", back_populates="user", uselist=False)
    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="Complaint.citizen_id")

class Department(Base):
    __tablename__ = "departments"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False)
    name_en = Column(String(150), nullable=False)
    name_ta = Column(String(150), nullable=False)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    officers = relationship("Officer", back_populates="department")
    complaints = relationship("Complaint", back_populates="assigned_department")

class Municipality(Base):
    __tablename__ = "municipalities"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name_en = Column(String(100), nullable=False)
    name_ta = Column(String(100), nullable=False)
    district = Column(String(100), default="Tiruchirappalli")
    state = Column(String(100), default="Tamil Nadu")
    center_lat = Column(Float, default=10.9413)
    center_lon = Column(Float, default=78.4485)
    created_at = Column(DateTime, default=utc_now)

    wards = relationship("Ward", back_populates="municipality")

class Ward(Base):
    __tablename__ = "wards"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    municipality_id = Column(String(36), ForeignKey("municipalities.id"))
    ward_number = Column(Integer, nullable=False)
    name_en = Column(String(150), nullable=False)
    name_ta = Column(String(150), nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    radius_meters = Column(Float, default=1200.0)

    municipality = relationship("Municipality", back_populates="wards")
    complaints = relationship("Complaint", back_populates="ward")

class Officer(Base):
    __tablename__ = "officers"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    department_id = Column(String(36), ForeignKey("departments.id"))
    assigned_ward_id = Column(String(36), ForeignKey("wards.id"), nullable=True)
    badge_number = Column(String(50), unique=True, nullable=False)
    designation = Column(String(100), nullable=False)
    is_on_duty = Column(Boolean, default=True)

    user = relationship("User", back_populates="officer_profile")
    department = relationship("Department", back_populates="officers")
    assigned_ward = relationship("Ward")

class ComplaintCategory(Base):
    __tablename__ = "complaint_categories"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False)
    name_en = Column(String(150), nullable=False)
    name_ta = Column(String(150), nullable=False)
    default_priority = Column(String(20), default="MEDIUM")
    icon_key = Column(String(50), default="alert-circle")
    is_active = Column(Boolean, default=True)

    complaints = relationship("Complaint", back_populates="category")

class RoutingRule(Base):
    __tablename__ = "routing_rules"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    category_id = Column(String(36), ForeignKey("complaint_categories.id"))
    target_department_id = Column(String(36), ForeignKey("departments.id"))
    priority_level = Column(String(20), default="MEDIUM")

    category = relationship("ComplaintCategory")
    target_department = relationship("Department")

class SLAPolicy(Base):
    __tablename__ = "sla_policies"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    category_id = Column(String(36), ForeignKey("complaint_categories.id"), unique=True)
    max_resolution_hours = Column(Integer, default=48)
    warning_hours = Column(Integer, default=36)
    escalation_tier1_hours = Column(Integer, default=52)
    escalation_tier2_hours = Column(Integer, default=72)

    category = relationship("ComplaintCategory")

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    public_reference = Column(String(30), unique=True, index=True, nullable=False)
    citizen_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    category_id = Column(String(36), ForeignKey("complaint_categories.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    language = Column(String(10), default="ta")
    priority = Column(String(20), default="MEDIUM")
    status = Column(
        String(30), 
        default="SUBMITTED", 
        index=True
    ) # SUBMITTED, ASSIGNED, IN_PROGRESS, RESOLVED_PENDING_VERIFICATION, VERIFIED_RESOLVED, NEEDS_REVIEW, DISPUTED, REOPENED
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address_text = Column(Text, nullable=True)
    landmark = Column(String(255), nullable=True)
    ward_id = Column(String(36), ForeignKey("wards.id"), nullable=True)
    assigned_department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    assigned_officer_id = Column(String(36), ForeignKey("officers.id"), nullable=True)
    
    # AI predictions
    ai_suggested_category = Column(String(50), nullable=True)
    ai_confidence = Column(Float, default=0.0)
    requires_human_review = Column(Boolean, default=False)
    
    # SLA & Timestamps
    due_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    category = relationship("ComplaintCategory", back_populates="complaints")
    ward = relationship("Ward", back_populates="complaints")
    assigned_department = relationship("Department", back_populates="complaints")
    assigned_officer = relationship("Officer")
    
    evidence = relationship("ComplaintEvidence", back_populates="complaint", cascade="all, delete-orphan")
    ai_predictions = relationship("AIPrediction", back_populates="complaint", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="complaint", cascade="all, delete-orphan")
    verification_request = relationship("VerificationRequest", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    public_proof = relationship("PublicProofRecord", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    escalations = relationship("EscalationEvent", back_populates="complaint", cascade="all, delete-orphan")
    feedback = relationship("ComplaintFeedback", back_populates="complaint", uselist=False, cascade="all, delete-orphan")

class ComplaintEvidence(Base):
    __tablename__ = "complaint_evidence"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    phase = Column(String(30), nullable=False) # 'INITIAL_SUBMISSION', 'WORK_ORDER', 'RESOLUTION_PROOF'
    media_type = Column(String(20), default="IMAGE") # 'IMAGE', 'VIDEO', 'AUDIO'
    file_path = Column(String(500), nullable=False)
    file_url = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    perceptual_hash = Column(String(64), nullable=True, index=True)
    exif_lat = Column(Float, nullable=True)
    exif_lon = Column(Float, nullable=True)
    uploaded_at = Column(DateTime, default=utc_now)

    complaint = relationship("Complaint", back_populates="evidence")

class AIPrediction(Base):
    __tablename__ = "ai_predictions"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    model_name = Column(String(100), default="Aadhirai-Hybrid-Vision-v1")
    suggested_category = Column(String(50), nullable=False)
    detected_objects = Column(Text, default="[]") # JSON string
    confidence = Column(Float, default=0.0)
    reason = Column(Text, nullable=True)
    requires_human_review = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    complaint = relationship("Complaint", back_populates="ai_predictions")

class WorkOrder(Base):
    __tablename__ = "work_orders"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(String(36), ForeignKey("officers.id"), nullable=False)
    order_number = Column(String(50), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    action_plan = Column(Text, nullable=False)
    estimated_cost = Column(Float, default=0.0)
    status = Column(String(30), default="CREATED") # 'CREATED', 'IN_PROGRESS', 'COMPLETED'
    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    complaint = relationship("Complaint", back_populates="work_orders")
    officer = relationship("Officer")

class VerificationRequest(Base):
    __tablename__ = "verification_requests"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), unique=True)
    status = Column(String(30), default="PENDING") # 'PENDING', 'PASSED', 'FLAGGED_REVIEW', 'REJECTED'
    ai_visual_delta_score = Column(Float, default=0.0) # 0.0 to 1.0 (difference from before)
    phash_match_detected = Column(Boolean, default=False) # true if before == after (fraud alert)
    gps_distance_delta_meters = Column(Float, default=0.0)
    audit_notes = Column(Text, nullable=True)
    reviewer_override_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(36), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    complaint = relationship("Complaint", back_populates="verification_request")

class PublicProofRecord(Base):
    __tablename__ = "public_proof_records"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), unique=True)
    public_reference = Column(String(30), unique=True, index=True, nullable=False)
    category_name = Column(String(100), nullable=False)
    approximate_lat = Column(Float, nullable=False) # truncated to 3 decimals
    approximate_lon = Column(Float, nullable=False)
    ward_name = Column(String(100), nullable=False)
    submitted_date = Column(DateTime, nullable=False)
    resolved_date = Column(DateTime, nullable=False)
    turnaround_hours = Column(Float, default=0.0)
    before_image_url = Column(String(500), nullable=False)
    after_image_url = Column(String(500), nullable=False)
    verification_summary = Column(Text, nullable=False)
    qr_code_url = Column(String(500), nullable=True)
    published_at = Column(DateTime, default=utc_now)

    complaint = relationship("Complaint", back_populates="public_proof")

class EscalationEvent(Base):
    __tablename__ = "escalation_events"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    level = Column(Integer, default=1) # 1: Ward supervisor, 2: Municipal engineer, 3: Commissioner
    trigger_reason = Column(String(100), nullable=False) # 'SLA_OVERDUE', 'CITIZEN_DISPUTE', 'UNASSIGNED_TIMEOUT'
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    complaint = relationship("Complaint", back_populates="escalations")

class ComplaintFeedback(Base):
    __tablename__ = "complaint_feedback"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), unique=True)
    citizen_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False) # 1 to 5
    comments = Column(Text, nullable=True)
    is_disputed = Column(Boolean, default=False)
    dispute_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    complaint = relationship("Complaint", back_populates="feedback")

class DuplicateLink(Base):
    __tablename__ = "duplicate_links"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    primary_complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    duplicate_complaint_id = Column(String(36), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    similarity_score = Column(Float, default=0.0)
    is_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
