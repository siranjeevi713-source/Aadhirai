import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

export default function PendingReviewsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [decision, setDecision] = useState('APPROVED')
  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState(null)

  useEffect(() => {
    fetchPending()
  }, [])

  const fetchPending = () => {
    setLoading(true)
    api.get('/reviews/pending')
      .then(res => setComplaints(res.data.complaints || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const handleDecision = async (e) => {
    e.preventDefault()
    if (!selectedComplaint) return
    setActionLoading(true)
    setActionMsg(null)

    try {
      await api.post(`/reviews/${selectedComplaint._id}/decide`, {
        decision,
        notes: notes || `Resolution verified: ${decision}`
      })

      setActionMsg({ type: 'success', text: `Review submitted as ${decision}!` })
      fetchPending()
      setTimeout(() => {
        setSelectedComplaint(null)
        setNotes('')
        setActionMsg(null)
      }, 1500)
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit review decision.' })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Pending Resolution Verification</h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Independent review of department proof photos before closure</p>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Title</th>
              <th>Department</th>
              <th>Incident Location</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading pending reviews...</td></tr>
            ) : complaints.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No complaints awaiting review in your district.</td></tr>
            ) : (
              complaints.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 800, color: '#075CE5' }}>{c.ticketNumber}</td>
                  <td style={{ fontWeight: 600 }}>{c.title}</td>
                  <td>{c.assignedDepartmentId?.nameEn || 'N/A'}</td>
                  <td style={{ fontSize: '12px' }}>{c.addressText || `${c.location?.coordinates[1]}, ${c.location?.coordinates[0]}`}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedComplaint(c)
                        setDecision('APPROVED')
                      }}
                      className="btn btn-primary"
                      style={{ padding: '4px 12px', fontSize: '11px' }}
                    >
                      Audit Proof
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Decision Modal */}
      {selectedComplaint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 12px', color: '#082D50' }}>
              Verify Resolution: {selectedComplaint.ticketNumber}
            </h2>

            {actionMsg && (
              <div style={{ padding: '10px', background: actionMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2', color: actionMsg.type === 'success' ? '#166534' : '#991B1B', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
                {actionMsg.text}
              </div>
            )}

            <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '14px', fontSize: '12px' }}>
              <div><strong>Title:</strong> {selectedComplaint.title}</div>
              <div style={{ marginTop: '4px' }}><strong>Dept:</strong> {selectedComplaint.assignedDepartmentId?.nameEn}</div>
              <div style={{ marginTop: '4px' }}><strong>Evidence Count:</strong> {selectedComplaint.evidence?.length || 0} file(s) attached</div>
            </div>

            <form onSubmit={handleDecision} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Verification Decision *</label>
                <select value={decision} onChange={e => setDecision(e.target.value)} className="input-field">
                  <option value="APPROVED">APPROVE (Proof verified, mark complaint VERIFIED)</option>
                  <option value="REJECTED">REJECT (Proof invalid, reopen complaint)</option>
                  <option value="MORE_EVIDENCE_REQUIRED">MORE EVIDENCE REQUIRED (Request clearer photo)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Audit Notes *</label>
                <textarea
                  required
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Explain proof findings (e.g. asphalt repair confirmed via before/after comparison)..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setSelectedComplaint(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Recording...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
