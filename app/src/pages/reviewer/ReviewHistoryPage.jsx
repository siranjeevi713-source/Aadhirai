import React, { useState, useEffect } from 'react'
import api from '../../services/api'

export default function ReviewHistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reviews/history')
      .then(res => setHistory(res.data.reviews || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Verification Decision History</h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Audit trail of independent resolution evaluations</p>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Complaint</th>
              <th>Decision</th>
              <th>Reviewer Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>Loading history...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No review decisions logged yet.</td></tr>
            ) : (
              history.map(h => (
                <tr key={h._id}>
                  <td style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {new Date(h.reviewedAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#075CE5' }}>{h.complaintId?.ticketNumber || 'N/A'}</div>
                    <div style={{ fontSize: '12px' }}>{h.complaintId?.title}</div>
                  </td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: h.decision === 'APPROVED' ? '#DCFCE7' : h.decision === 'REJECTED' ? '#FEE2E2' : '#FEF3C7', color: h.decision === 'APPROVED' ? '#15803D' : h.decision === 'REJECTED' ? '#991B1B' : '#D97706' }}>
                      {h.decision}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#334155' }}>{h.notes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
