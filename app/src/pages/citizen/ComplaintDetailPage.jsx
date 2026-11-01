import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

export default function ComplaintDetailPage() {
  const { id } = useParams()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/complaints/${id}`)
      .then(res => setComplaint(res.data.complaint || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: '24px' }}>Loading complaint details...</div>
  if (!complaint) return <div style={{ padding: '24px' }}>Complaint not found.</div>

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/citizen/complaints" style={{ fontSize: '12px', color: '#075CE5', fontWeight: 700, textDecoration: 'none' }}>
          ← Back to My Complaints
        </Link>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#075CE5' }}>{complaint.ticketNumber}</span>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0', color: '#082D50' }}>{complaint.title}</h1>
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: '0 0 20px' }}>
          {complaint.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}>
          <div><strong>Incident District:</strong> {complaint.districtId?.nameEn}</div>
          <div><strong>Category:</strong> {complaint.citizenConfirmedCategory || complaint.categoryCode}</div>
          <div><strong>Assigned Dept:</strong> {complaint.assignedDepartmentId?.nameEn || 'Routing Pending'}</div>
          <div><strong>Location:</strong> {complaint.addressText || 'GPS Coordinates Attached'}</div>
          <div><strong>SLA Commitment:</strong> {complaint.slaHours || 48} Hours</div>
          <div><strong>Submitted Date:</strong> {new Date(complaint.createdAt).toLocaleString()}</div>
        </div>
      </div>

      {/* Status History Timeline */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: '#082D50' }}>Resolution Timeline & Proof Audit</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid #E2E8F0', paddingLeft: '20px', marginLeft: '10px' }}>
          {complaint.statusHistory?.map((h, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '-27px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#075CE5', border: '2px solid #fff' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatusBadge status={h.toStatus} />
                <span style={{ fontSize: '11px', color: '#64748B' }}>{new Date(h.changedAt).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                {h.remarks || `Status transitioned from ${h.fromStatus} to ${h.toStatus}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
