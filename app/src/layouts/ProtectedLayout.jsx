import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function ProtectedLayout({ allowedRoles, title }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard
    const map = { super_admin: '/super-admin', department_admin: '/dept-admin', reviewer: '/reviewer', citizen: '/citizen' }
    return <Navigate to={map[user.role] || '/login'} replace />
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

