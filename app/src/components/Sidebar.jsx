import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  complaints: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  districts: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10z"/></svg>,
  departments: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  routing: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
  reviews: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>,
  audit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M13 2v7h7"/></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

const NAV_CONFIGS = {
  super_admin: [
    { label: 'Overview', group: 'Dashboard', items: [
      { to: '/super-admin', label: 'Dashboard', icon: 'dashboard', end: true },
    ]},
    { label: 'Management', group: 'Management', items: [
      { to: '/super-admin/districts', label: 'Districts', icon: 'districts' },
      { to: '/super-admin/departments', label: 'Departments', icon: 'departments' },
      { to: '/super-admin/users', label: 'User Management', icon: 'users' },
      { to: '/super-admin/routing', label: 'Routing Rules', icon: 'routing' },
    ]},
    { label: 'Oversight', group: 'Oversight', items: [
      { to: '/super-admin/complaints', label: 'All Complaints', icon: 'complaints' },
      { to: '/super-admin/audit', label: 'Audit Logs', icon: 'audit' },
    ]},
  ],
  department_admin: [
    { label: 'Overview', group: 'Overview', items: [
      { to: '/dept-admin', label: 'Dashboard', icon: 'dashboard', end: true },
      { to: '/dept-admin/complaints', label: 'Complaints', icon: 'complaints' },
    ]},
  ],
  reviewer: [
    { label: 'Review', group: 'Review', items: [
      { to: '/reviewer', label: 'Dashboard', icon: 'dashboard', end: true },
      { to: '/reviewer/pending', label: 'Pending Reviews', icon: 'reviews' },
      { to: '/reviewer/history', label: 'Review History', icon: 'audit' },
    ]},
  ],
  citizen: [
    { label: 'My Account', group: 'My Account', items: [
      { to: '/citizen', label: 'Dashboard', icon: 'dashboard', end: true },
      { to: '/citizen/submit', label: 'Report Issue', icon: 'plus' },
      { to: '/citizen/complaints', label: 'My Complaints', icon: 'complaints' },
      { to: '/citizen/notifications', label: 'Notifications', icon: 'bell' },
      { to: '/citizen/profile', label: 'Profile', icon: 'profile' },
    ]},
  ],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  if (!user) return null

  const sections = NAV_CONFIGS[user.role] || []
  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-name">AADHIRAI</div>
        <div className="brand-sub">NAMMAOOR AI</div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((sec) => (
          <div key={sec.group}>
            <div className="nav-section-label">{sec.label}</div>
            {sec.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {icons[item.icon]}
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <div className="avatar">{initials}</div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{user.name?.split(' ')[0]}</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>{user.role.replace('_', ' ')}</div>
          </div>
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
          {icons.logout} Sign Out
        </button>
      </div>
    </aside>
  )
}

export { icons }

