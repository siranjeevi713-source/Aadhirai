import React, { useState, useEffect } from 'react'
import api from '../../services/api'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = () => {
    setLoading(true)
    api.get('/notifications')
      .then(res => setNotifications(res.data.notifications || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      fetchNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Notifications</h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Real-time updates regarding your filed civic complaints</p>
        </div>
        <button onClick={markAllRead} className="btn btn-secondary" style={{ fontSize: '12px' }}>
          Mark All as Read
        </button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
            No notifications at this time.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.map(n => (
              <div key={n._id} style={{ padding: '14px', borderRadius: '10px', background: n.isRead ? '#F8FAFC' : '#EFF6FF', border: '1px solid', borderColor: n.isRead ? '#E2E8F0' : '#BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#082D50' }}>{n.title}</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{n.message}</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '6px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.isRead && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#075CE5', display: 'inline-block' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

