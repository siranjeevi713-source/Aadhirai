const STATUS_MAP = {
  SUBMITTED: { label: 'Submitted', cls: 'badge-gray' },
  AI_ANALYSIS: { label: 'AI Analysis', cls: 'badge-blue' },
  CITIZEN_CONFIRMATION: { label: 'Pending Confirm', cls: 'badge-yellow' },
  LOCATION_VERIFICATION: { label: 'Location Check', cls: 'badge-yellow' },
  ROUTED: { label: 'Routed', cls: 'badge-blue' },
  ASSIGNED: { label: 'Assigned', cls: 'badge-blue' },
  IN_PROGRESS: { label: 'In Progress', cls: 'badge-yellow' },
  RESOLVED_PENDING_REVIEW: { label: 'Pending Review', cls: 'badge-yellow' },
  VERIFIED: { label: 'Verified', cls: 'badge-green' },
  CLOSED: { label: 'Closed', cls: 'badge-green' },
  REJECTED: { label: 'Rejected', cls: 'badge-red' },
  MORE_EVIDENCE_REQUIRED: { label: 'More Evidence', cls: 'badge-yellow' },
  ESCALATED: { label: 'Escalated', cls: 'badge-red' },
  LOCATION_REVIEW_REQUIRED: { label: 'Location Review', cls: 'badge-yellow' },
  ROUTING_REVIEW_REQUIRED: { label: 'Routing Review', cls: 'badge-yellow' },
}

export default function StatusBadge({ status }) {
  const map = STATUS_MAP[status] || { label: status, cls: 'badge-gray' }
  return <span className={`badge ${map.cls}`}>{map.label}</span>
}

