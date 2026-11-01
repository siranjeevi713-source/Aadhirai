import React, { useState, useEffect } from 'react'
import api from '../../services/api'

export default function RoutingRulesPage() {
  const [rules, setRules] = useState([])
  const [districts, setDistricts] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/super-admin/districts').then(res => setDistricts(res.data))
    fetchRules()
  }, [])

  const fetchRules = (districtId = '') => {
    setLoading(true)
    const url = districtId ? `/super-admin/routing-rules?districtId=${districtId}` : '/super-admin/routing-rules'
    api.get(url)
      .then(res => setRules(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const handleDistrictChange = (e) => {
    const dId = e.target.value
    setSelectedDistrict(dId)
    fetchRules(dId)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Routing Rules Configuration</h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Deterministic category-to-department routing matrix per district</p>
        </div>
        <select
          value={selectedDistrict}
          onChange={handleDistrictChange}
          className="input-field"
          style={{ width: '220px' }}
        >
          <option value="">All Districts</option>
          {districts.map(d => (
            <option key={d._id} value={d._id}>{d.nameEn}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>District</th>
              <th>Category Code</th>
              <th>Routed Department</th>
              <th>Default SLA (Hours)</th>
              <th>Auto-Assign</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Loading routing rules...</td></tr>
            ) : rules.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No routing rules configured.</td></tr>
            ) : (
              rules.map(r => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 700 }}>{r.districtId?.nameEn || 'N/A'}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#075CE5' }}>{r.categoryCode}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.departmentId?.nameEn || 'N/A'}</td>
                  <td>{r.defaultSlaHours || 48}h</td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: r.autoAssign ? '#DCFCE7' : '#FEF3C7', color: r.autoAssign ? '#15803D' : '#D97706' }}>
                      {r.autoAssign ? 'Yes (Auto)' : 'Manual'}
                    </span>
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
