import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

export default function CitizenDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics/citizen')
      .then(res => setSummary(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: '24px' }}>Loading citizen dashboard...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Citizen Portal</h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Track your civic grievances and report new incidents</p>
        </div>
        <Link to="/citizen/submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
          + Report New Issue
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Submitted</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#082D50', marginTop: '4px' }}>{summary?.total || 0}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>In Progress</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#075CE5', marginTop: '4px' }}>{summary?.inProgress || 0}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Under Review</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>{summary?.underReview || 0}</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Verified Resolved</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#16A34A', marginTop: '4px' }}>{summary?.resolved || 0}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#082D50' }}>Recent Grievances</h3>
          <Link to="/citizen/complaints" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            View All ({summary?.total || 0}) →
          </Link>
        </div>

        {summary?.recentComplaints?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B' }}>
            No complaints filed yet. Click "Report New Issue" to file one.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Title</th>
                <th>Status</th>
                <th>Incident District</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {summary?.recentComplaints?.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 800, color: '#075CE5' }}>
                    <Link to={`/citizen/complaints/${c._id}`}>{c.ticketNumber}</Link>
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.title}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>{c.districtId?.nameEn || 'N/A'}</td>
                  <td style={{ fontSize: '12px', color: '#64748B' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

