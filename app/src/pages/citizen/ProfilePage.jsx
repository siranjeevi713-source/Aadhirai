import React from 'react'
import { useAuth } from '../../context/AuthContext'

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Citizen Profile</h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Your registered citizen credentials & home district</p>
      </div>

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Full Name</span>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#082D50', marginTop: '2px' }}>{user?.fullName}</div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Email Address</span>
          <div style={{ fontSize: '14px', color: '#334155', marginTop: '2px' }}>{user?.email}</div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Mobile Number</span>
          <div style={{ fontSize: '14px', color: '#334155', marginTop: '2px' }}>{user?.mobileNumber}</div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Home District</span>
          <div style={{ fontSize: '14px', color: '#334155', marginTop: '2px' }}>
            {user?.homeDistrictId?.nameEn || 'Salem'}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>System Role</span>
          <div style={{ marginTop: '4px' }}>
            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: '#DCFCE7', color: '#15803D' }}>
              CITIZEN
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

