import { useAuth } from '../context/AuthContext'

export default function Topbar({ title }) {
  const { user } = useAuth()
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>
      {user && (
        <div className="topbar-user">
          <div className="avatar">{initials}</div>
          <span>{user.name?.split(' ')[0]}</span>
          <span style={{ fontSize: '0.7rem', background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>
            {user.role?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      )}
    </header>
  )
}

