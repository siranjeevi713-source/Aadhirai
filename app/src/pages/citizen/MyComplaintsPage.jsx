import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/complaints/my')
      .then(res => setComplaints(res.data.complaints || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>My Grievance History</h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Full lifecycle timeline from submission to verified proof</p>
        </div>
        <Link to="/citizen/submit" className="btn btn-primary">
          + Report New Issue
        </Link>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Title</th>
              <th>Incident District</th>
              <th>Assigned Department</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Loading complaints...</td></tr>
            ) : complaints.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No grievances submitted yet.</td></tr>
            ) : (
              complaints.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 800, color: '#075CE5' }}>{c.ticketNumber}</td>
                  <td style={{ fontWeight: 600 }}>{c.title}</td>
                  <td>{c.districtId?.nameEn || 'N/A'}</td>
                  <td>{c.assignedDepartmentId?.nameEn || 'Pending Routing'}</td>
                  <td>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: c.priority === 'CRITICAL' ? '#DC2626' : c.priority === 'HIGH' ? '#D97706' : '#2563EB' }}>
                      {c.priority}
                    </span>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <Link to={`/citizen/complaints/${c._id}`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                      View Details
                    </Link>
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

