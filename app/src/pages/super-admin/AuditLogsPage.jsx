import React, { useState, useEffect } from 'react'
import api from '../../services/api'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/super-admin/audit-logs')
      .then(res => setLogs(res.data.logs || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>System Audit Trail</h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>DPDPA 2023 & IT Act compliant immutable activity log</p>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Loading audit logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No audit logs recorded.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log._id}>
                  <td style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 700, color: '#082D50' }}>{log.action}</td>
                  <td style={{ fontSize: '12px' }}>{log.actorId?.fullName || log.actorId?.email || 'System'}</td>
                  <td>
                    <span style={{ fontSize: '11px', padding: '2px 6px', background: '#F1F5F9', borderRadius: '4px', fontWeight: 600 }}>
                      {log.entityType}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#475569', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {JSON.stringify(log.details || {})}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

