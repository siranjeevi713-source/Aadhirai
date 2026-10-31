export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface OfficerProfile {
  id: string;
  badge_number: string;
  designation: string;
  department_id: string;
  is_on_duty: boolean;
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  full_name: string;
  preferred_language: string;
  is_active: boolean;
  roles: Role[];
  officer_profile?: OfficerProfile;
}

export interface Category {
  id: string;
  code: string;
  name_en: string;
  name_ta: string;
  default_priority?: string;
  icon_key?: string;
  department_id?: string;
  base_sla_hours?: number;
  is_active?: boolean;
}

export interface Ward {
  id: string;
  ward_number: number;
  number?: number;
  name_en: string;
  name_ta: string;
  center_lat: number;
  center_lon: number;
}

export interface Department {
  id: string;
  code: string;
  name_en: string;
  name_ta: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface Evidence {
  id: string;
  phase: string;
  media_type: string;
  file_url: string;
  mime_type: string;
  file_size_bytes: number;
  perceptual_hash?: string;
  uploaded_at: string;
}

export interface WorkOrder {
  id: string;
  order_number: string;
  title: string;
  action_plan: string;
  estimated_cost: number;
  status: string;
  created_at: string;
}

export interface Verification {
  id: string;
  status: string;
  ai_visual_delta_score: number;
  phash_match_detected: boolean;
  gps_distance_delta_meters: number;
  audit_notes?: string;
  reviewer_override_notes?: string;
  reviewed_at?: string;
  before_evidence?: {
    file_url?: string;
    perceptual_hash?: string;
  };
  after_evidence?: {
    file_url?: string;
    perceptual_hash?: string;
  };
}

export interface Feedback {
  id: string;
  rating: number;
  comments?: string;
  is_disputed: boolean;
  dispute_reason?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  public_reference: string;
  reference_number?: string;
  title: string;
  description: string;
  language: string;
  priority: string;
  status: string;
  latitude: number;
  longitude: number;
  address_text?: string;
  landmark?: string;
  category?: Category;
  ward?: Ward;
  ward_name?: string;
  department_name?: string;
  assigned_department?: Department;
  assigned_officer_name?: string;
  ai_suggested_category?: string;
  ai_confidence?: number;
  requires_human_review?: boolean;
  due_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at?: string;
  evidence?: Evidence[];
  work_orders?: WorkOrder[];
  verification?: Verification;
  feedback?: Feedback;
}

export interface AnalyticsOverview {
  total_complaints: number;
  pending_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  reopened_complaints: number;
  escalated_complaints: number;
  sla_compliance_rate: number;
  average_resolution_hours: number;
}

export interface WardStat {
  ward_number: number;
  ward_name: string;
  complaint_count: number;
  resolved_count: number;
}

export interface DepartmentStat {
  department_name: string;
  total_assigned: number;
  resolved_count: number;
  compliance_rate: number;
}

export interface HotspotItem {
  category_name: string;
  latitude: number;
  longitude: number;
  incident_count: number;
  severity: string;
}

export interface PublicProof {
  id?: string;
  complaint_id?: string;
  public_reference: string;
  reference_number?: string;
  category_name?: string;
  category_name_en?: string;
  category_name_ta?: string;
  approximate_lat?: number;
  approximate_lon?: number;
  ward_name?: string;
  ward_number?: number;
  department_name?: string;
  department_name_en?: string;
  department_name_ta?: string;
  submitted_date?: string;
  reported_at?: string;
  resolved_date?: string;
  resolved_at?: string;
  turnaround_hours?: number;
  sla_hours?: number;
  before_image_url: string;
  after_image_url: string;
  verification_summary?: string;
  verification_notes?: string;
  proof_hash?: string;
  qr_code_url?: string;
  published_at?: string;
}

export interface PublicExploreItem {
  id: string;
  public_reference: string;
  reference_number?: string;
  title: string;
  status: string;
  priority: string;
  category_code?: string;
  category_name_ta?: string;
  category_name_en?: string;
  category?: Category;
  ward_number?: number;
  ward_name?: string;
  ward?: Ward;
  department_name?: string;
  approximate_lat?: number;
  approximate_lon?: number;
  latitude?: number;
  longitude?: number;
  masked_address?: string;
  photo_url?: string;
  created_at: string;
  due_at?: string;
  resolved_at?: string;
  has_proof?: boolean;
}

export interface PublicTrackResponse {
  id: string;
  public_reference: string;
  reference_number?: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  category_name_ta?: string;
  category_name_en?: string;
  ward_name?: string;
  ward?: { number?: number; name_en?: string };
  department_name?: string;
  approximate_lat?: number;
  approximate_lon?: number;
  address?: string;
  before_photo?: string;
  after_photo?: string;
  due_at?: string;
  created_at: string;
  resolved_at?: string;
  timeline?: {
    action: string;
    details: string;
    timestamp: string;
  }[];
  has_proof?: boolean;
}
