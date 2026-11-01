import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function ReviewerDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics/reviewer')
      .then(res => setSummary(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: '24px' }}>Loading verification workspace...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Independent Reviewer Center</h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>
          District: <strong>{summary?.district?.nameEn}</strong> • Independent Resolution Verification
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Pending Verification</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>{summary?.pendingReviews || 0}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Verified (Approved)</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#16A34A', marginTop: '4px' }}>{summary?.myDecisions?.APPROVED || 0}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Rejections / Disputed</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>{summary?.myDecisions?.REJECTED || 0}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>More Evidence Required</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#8B5CF6', marginTop: '4px' }}>{summary?.myDecisions?.MORE_EVIDENCE_REQUIRED || 0}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: '#082D50' }}>Verification Workflow</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Audit before & after photographic evidence to prevent false resolutions</p>
          </div>
          <Link to="/reviewer/pending" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
            Open Pending Queue ({summary?.pendingReviews || 0}) →
          </Link>
        </div>
      </div>
    </div>
  )
}
