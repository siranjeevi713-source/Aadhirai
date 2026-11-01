import React, { useState, useEffect } from 'react'
import api from '../../services/api'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [districts, setDistricts] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formError, setFormError] = useState(null)
  const [formSuccess, setFormSuccess] = useState(null)

  // Provision Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [password, setPassword] = useState('Admin@123')
  const [role, setRole] = useState('department_admin')
  const [assignedDistrictId, setAssignedDistrictId] = useState('')
  const [assignedDepartmentId, setAssignedDepartmentId] = useState('')

  useEffect(() => {
    fetchUsers()
    api.get('/super-admin/districts').then(res => {
      setDistricts(res.data)
      if (res.data.length > 0) setAssignedDistrictId(res.data[0]._id)
    })
  }, [])

  useEffect(() => {
    if (assignedDistrictId) {
      api.get(`/super-admin/departments?districtId=${assignedDistrictId}`).then(res => {
        setDepartments(res.data)
        if (res.data.length > 0) setAssignedDepartmentId(res.data[0]._id)
        else setAssignedDepartmentId('')
      })
    }
  }, [assignedDistrictId])

  const fetchUsers = () => {
    setLoading(true)
    api.get('/super-admin/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const handleProvision = async (e) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    try {
      const payload = {
        fullName,
        email,
        mobileNumber,
        password,
        role,
        assignedDistrictId
      }
      if (role === 'department_admin') {
        payload.assignedDepartmentId = assignedDepartmentId
      }

      await api.post('/super-admin/users', payload)
      setFormSuccess(`User ${fullName} successfully provisioned as ${role}!`)
      fetchUsers()
      setTimeout(() => {
        setShowModal(false)
        setFormSuccess(null)
        setFullName('')
        setEmail('')
        setMobileNumber('')
      }, 1500)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to provision user.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>User Management & Provisioning</h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Provision Department Admins and District Reviewers directly</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Provision User
        </button>
      </div>

      {/* Users Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Assigned District</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading users...</td></tr>
            ) : (
              users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 700 }}>{u.fullName}</td>
                  <td>
                    <div style={{ fontSize: '12px' }}>{u.email}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{u.mobileNumber}</div>
                  </td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: u.role === 'super_admin' ? '#EDE9FE' : u.role === 'reviewer' ? '#FEF3C7' : '#EFF6FF', color: u.role === 'super_admin' ? '#7C3AED' : u.role === 'reviewer' ? '#D97706' : '#1D4ED8' }}>
                      {u.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>{u.assignedDistrictId?.nameEn || u.homeDistrictId?.nameEn || 'Statewide'}</td>
                  <td>{u.assignedDepartmentId?.nameEn || 'N/A'}</td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: u.isActive ? '#DCFCE7' : '#F1F5F9', color: u.isActive ? '#15803D' : '#64748B' }}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Provision Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px', color: '#082D50' }}>Provision Official Account</h2>
            
            {formError && <div style={{ padding: '10px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{formError}</div>}
            {formSuccess && <div style={{ padding: '10px', background: '#DCFCE7', color: '#166534', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{formSuccess}</div>}

            <form onSubmit={handleProvision} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Full Name *</label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" placeholder="Officer Name" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Official Email *</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="officer@aadhirai.gov.in" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Mobile Number *</label>
                  <input type="tel" required value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="input-field" placeholder="9876543210" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Role *</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="input-field">
                  <option value="department_admin">Department Admin (Resolves Issues)</option>
                  <option value="reviewer">District Reviewer (Verifies Resolutions)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Assigned District *</label>
                <select value={assignedDistrictId} onChange={e => setAssignedDistrictId(e.target.value)} className="input-field" required>
                  {districts.map(d => (
                    <option key={d._id} value={d._id}>{d.nameEn} ({d.code})</option>
                  ))}
                </select>
              </div>

              {role === 'department_admin' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Assigned Department *</label>
                  <select value={assignedDepartmentId} onChange={e => setAssignedDepartmentId(e.target.value)} className="input-field" required>
                    {departments.length === 0 ? (
                      <option value="">No departments in this district</option>
                    ) : (
                      departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.nameEn} ({dept.code})</option>
                      ))
                    )}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Temporary Password *</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input-field" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

