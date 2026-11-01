import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

export default function DeptDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics/department-admin')
      .then(res => setSummary(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: '24px' }}>Loading department dashboard...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Department Operations</h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>
          District: <strong>{summary?.district?.nameEn}</strong> • Department: <strong>{summary?.department?.nameEn}</strong>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Assigned</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#082D50', marginTop: '4px' }}>{summary?.total || 0}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Action Required</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#075CE5', marginTop: '4px' }}>
            {(summary?.byStatus?.ROUTED || 0) + (summary?.byStatus?.ASSIGNED || 0)}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>In Progress</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#8B5CF6', marginTop: '4px' }}>{summary?.byStatus?.IN_PROGRESS || 0}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Pending Review</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>{summary?.byStatus?.RESOLVED_PENDING_REVIEW || 0}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#082D50' }}>Recent Assigned Grievances</h3>
          <Link to="/dept-admin/complaints" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            View All Grievances →
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {summary?.byStatus && Object.entries(summary.byStatus).map(([st, cnt]) => (
            <div key={st} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <StatusBadge status={st} />
              <span style={{ fontWeight: 800, fontSize: '16px' }}>{cnt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

