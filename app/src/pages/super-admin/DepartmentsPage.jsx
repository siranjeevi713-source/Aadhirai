import React, { useState, useEffect } from 'react'
import api from '../../services/api'

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [districts, setDistricts] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/super-admin/districts').then(res => setDistricts(res.data))
    fetchDepartments()
  }, [])

  const fetchDepartments = (districtId = '') => {
    setLoading(true)
    const url = districtId ? `/super-admin/departments?districtId=${districtId}` : '/super-admin/departments'
    api.get(url)
      .then(res => setDepartments(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const handleDistrictChange = (e) => {
    const dId = e.target.value
    setSelectedDistrict(dId)
    fetchDepartments(dId)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Department Management</h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>District-scoped municipal wings and resolution teams</p>
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
              <th>Code</th>
              <th>Department Name</th>
              <th>District</th>
              <th>Contact Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Loading departments...</td></tr>
            ) : departments.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No departments found.</td></tr>
            ) : (
              departments.map(dept => (
                <tr key={dept._id}>
                  <td style={{ fontWeight: 700, color: '#075CE5' }}>{dept.code}</td>
                  <td style={{ fontWeight: 600 }}>{dept.nameEn}</td>
                  <td>{dept.districtId?.nameEn || 'N/A'}</td>
                  <td style={{ fontSize: '12px', color: '#64748B' }}>{dept.contactEmail || 'N/A'}</td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: dept.isActive ? '#DCFCE7' : '#F1F5F9', color: dept.isActive ? '#15803D' : '#64748B' }}>
                      {dept.isActive ? 'Active' : 'Inactive'}
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
