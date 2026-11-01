import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

export default function DeptComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [newStatus, setNewStatus] = useState('IN_PROGRESS')
  const [remarks, setRemarks] = useState('')
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState(null)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = () => {
    setLoading(true)
    api.get('/complaints/department')
      .then(res => setComplaints(res.data.complaints || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    if (!selectedComplaint) return
    setActionLoading(true)
    setActionMsg(null)

    try {
      // 1. If evidence attached, upload it
      if (evidenceFile) {
        const formData = new FormData()
        formData.append('file', evidenceFile)
        formData.append('type', 'AFTER')
        formData.append('caption', remarks || 'Resolution evidence')
        await api.post(`/complaints/${selectedComplaint._id}/evidence`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      // 2. Update status
      await api.patch(`/complaints/${selectedComplaint._id}/status`, {
        status: newStatus,
        remarks: remarks || `Status transitioned to ${newStatus}`
      })

      setActionMsg({ type: 'success', text: `Status updated to ${newStatus}!` })
      fetchComplaints()
      setTimeout(() => {
        setSelectedComplaint(null)
        setRemarks('')
        setEvidenceFile(null)
        setActionMsg(null)
      }, 1500)
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update status.' })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Assigned Department Grievances</h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Manage resolution workflow and upload photographic evidence</p>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Title</th>
              <th>Incident Location</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading grievances...</td></tr>
            ) : complaints.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No grievances assigned to your department.</td></tr>
            ) : (
              complaints.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 800, color: '#075CE5' }}>{c.ticketNumber}</td>
                  <td style={{ fontWeight: 600 }}>{c.title}</td>
                  <td style={{ fontSize: '12px' }}>{c.addressText || `${c.location?.coordinates[1]}, ${c.location?.coordinates[0]}`}</td>
                  <td>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: c.priority === 'CRITICAL' ? '#DC2626' : c.priority === 'HIGH' ? '#D97706' : '#2563EB' }}>
                      {c.priority}
                    </span>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    {c.status !== 'VERIFIED' && c.status !== 'CLOSED' && (
                      <button
                        onClick={() => {
                          setSelectedComplaint(c)
                          setNewStatus(c.status === 'ROUTED' || c.status === 'ASSIGNED' ? 'IN_PROGRESS' : 'RESOLVED_PENDING_REVIEW')
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        Update Status
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {selectedComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 12px', color: '#082D50' }}>
              Update {selectedComplaint.ticketNumber}
            </h2>

            {actionMsg && (
              <div style={{ padding: '10px', background: actionMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2', color: actionMsg.type === 'success' ? '#166534' : '#991B1B', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
                {actionMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Target Status *</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field">
                  <option value="IN_PROGRESS">IN_PROGRESS (Work in Progress)</option>
                  <option value="RESOLVED_PENDING_REVIEW">RESOLVED_PENDING_REVIEW (Send to Reviewer)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Work Remarks</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Detail work undertaken or resolution report..."
                />
              </div>

              {newStatus === 'RESOLVED_PENDING_REVIEW' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Upload Resolution Photographic Evidence
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setEvidenceFile(e.target.files[0])}
                    className="input-field"
                  />
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    Attach proof photo for the independent district reviewer.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setSelectedComplaint(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

