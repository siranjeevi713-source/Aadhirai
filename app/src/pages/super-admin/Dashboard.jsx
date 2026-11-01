import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

export default function SuperAdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/super-admin/summary')
      .then(res => setSummary(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: '24px' }}>Loading analytics...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Global Control Dashboard</h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Statewide civic operations & department routing health</p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Districts</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#075CE5', marginTop: '4px' }}>{summary?.districtsCount || 0}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Active Departments</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#13C6B5', marginTop: '4px' }}>{summary?.departmentsCount || 0}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Routing Rules</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#8B5CF6', marginTop: '4px' }}>{summary?.routingRulesCount || 0}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Complaints</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#082D50', marginTop: '4px' }}>{summary?.complaintsTotal || 0}</div>
        </div>
      </div>

      {/* Complaints by Status */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: '#082D50' }}>Statewide Status Breakdown</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {summary?.complaintsByStatus && Object.entries(summary.complaintsByStatus).map(([status, count]) => (
            <div key={status} style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', minWidth: '130px' }}>
              <div style={{ marginBottom: '6px' }}><StatusBadge status={status} /></div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
