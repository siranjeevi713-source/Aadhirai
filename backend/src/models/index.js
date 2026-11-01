const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── User ──────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['super_admin', 'department_admin', 'reviewer', 'citizen'],
    default: 'citizen',
  },
  homeDistrictId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', default: null },
  assignedDistrictId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', default: null },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('passwordHash') && !this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.passwordHash; return ret; },
});

const User = mongoose.model('User', userSchema);

// ─── District ─────────────────────────────────────────────────────────────────
const districtSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  nameTa: { type: String, default: '' },
  state: { type: String, default: 'Tamil Nadu' },
  center: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

districtSchema.index({ center: '2dsphere' });
const District = mongoose.model('District', districtSchema);

// ─── Department ───────────────────────────────────────────────────────────────
const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  description: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);

// ─── Category ─────────────────────────────────────────────────────────────────
const categorySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  nameTa: { type: String, default: '' },
  description: { type: String, default: '' },
  defaultSeverity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  slaHours: { type: Number, default: 48 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

// ─── Routing Rule ─────────────────────────────────────────────────────────────
const routingRuleSchema = new mongoose.Schema({
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  categoryCode: { type: String, required: true, uppercase: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

routingRuleSchema.index({ districtId: 1, categoryCode: 1 }, { unique: true });
const RoutingRule = mongoose.model('RoutingRule', routingRuleSchema);

// ─── Complaint ────────────────────────────────────────────────────────────────
const complaintSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true, index: true },
  citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Location — incident site NOT citizen home
  incidentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  incidentAddress: { type: String, default: '' },
  incidentDistrictId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', default: null },
  registeredDistrictId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', default: null },

  // Category
  aiPredictedCategory: { type: String, default: null },
  aiConfidence: { type: Number, default: 0 },
  aiExplanation: { type: String, default: '' },
  aiModelVersion: { type: String, default: '' },
  citizenConfirmedCategory: { type: String, required: true },

  // Routing
  categoryCode: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  assignedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Meta
  title: { type: String, required: true },
  description: { type: String, default: '' },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },

  // Status lifecycle
  status: {
    type: String,
    enum: [
      'SUBMITTED', 'AI_ANALYSIS', 'CITIZEN_CONFIRMATION', 'LOCATION_VERIFICATION',
      'ROUTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED_PENDING_REVIEW',
      'VERIFIED', 'CLOSED', 'LOCATION_REVIEW_REQUIRED', 'ROUTING_REVIEW_REQUIRED',
      'REJECTED', 'MORE_EVIDENCE_REQUIRED', 'ESCALATED',
    ],
    default: 'SUBMITTED',
    index: true,
  },

  // Evidence
  beforeImageUrl: { type: String, default: null },
  afterImageUrl: { type: String, default: null },

  // Timestamps
  dueAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null },
  verifiedAt: { type: Date, default: null },
}, { timestamps: true });

complaintSchema.index({ incidentLocation: '2dsphere' });
const Complaint = mongoose.model('Complaint', complaintSchema);

// ─── Status History ───────────────────────────────────────────────────────────
const statusHistorySchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  previousStatus: { type: String, default: null },
  newStatus: { type: String, required: true },
  changedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reason: { type: String, default: '' },
}, { timestamps: true });

const StatusHistory = mongoose.model('StatusHistory', statusHistorySchema);

// ─── Evidence ─────────────────────────────────────────────────────────────────
const evidenceSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phase: { type: String, enum: ['INITIAL', 'RESOLUTION'], required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSizeBytes: { type: Number, default: 0 },
}, { timestamps: true });

const Evidence = mongoose.model('Evidence', evidenceSchema);

// ─── Review ───────────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true, unique: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  decision: { type: String, enum: ['APPROVED', 'REJECTED', 'MORE_EVIDENCE_REQUIRED'], default: null },
  notes: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

// ─── Notification ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['STATUS_UPDATE', 'ASSIGNMENT', 'REVIEW', 'SYSTEM'], default: 'STATUS_UPDATE' },
  isRead: { type: Boolean, default: false },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

// ─── Audit Log ────────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' },
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// ─── Budget ───────────────────────────────────────────────────────────────────
const budgetSchema = new mongoose.Schema({
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  fiscalYear: { type: String, required: true },
  allocatedAmount: { type: Number, default: 0 },
  spentAmount: { type: Number, default: 0 },
  description: { type: String, default: '' },
}, { timestamps: true });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = {
  User, District, Department, Category, RoutingRule,
  Complaint, StatusHistory, Evidence, Review,
  Notification, AuditLog, Budget,
};

