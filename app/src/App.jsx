import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedLayout from './layouts/ProtectedLayout'

// Public Pages
import HomePage from './pages/public/HomePage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/Dashboard'
import DistrictsPage from './pages/super-admin/DistrictsPage'
import DepartmentsPage from './pages/super-admin/DepartmentsPage'
import UsersPage from './pages/super-admin/UsersPage'
import RoutingRulesPage from './pages/super-admin/RoutingRulesPage'
import AllComplaintsPage from './pages/super-admin/AllComplaintsPage'
import AuditLogsPage from './pages/super-admin/AuditLogsPage'

// Dept Admin Pages
import DeptDashboard from './pages/dept-admin/Dashboard'
import DeptComplaintsPage from './pages/dept-admin/ComplaintsPage'

// Reviewer Pages
import ReviewerDashboard from './pages/reviewer/Dashboard'
import PendingReviewsPage from './pages/reviewer/PendingReviewsPage'
import ReviewHistoryPage from './pages/reviewer/ReviewHistoryPage'

// Citizen Pages
import CitizenDashboard from './pages/citizen/Dashboard'
import SubmitComplaintPage from './pages/citizen/SubmitComplaintPage'
import MyComplaintsPage from './pages/citizen/MyComplaintsPage'
import ComplaintDetailPage from './pages/citizen/ComplaintDetailPage'
import NotificationsPage from './pages/citizen/NotificationsPage'
import ProfilePage from './pages/citizen/ProfilePage'

export default function App() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={user ? <Navigate to={`/${user.role.replace('_', '-')}`} replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/citizen" replace /> : <RegisterPage />} />

        {/* Super Admin Workspace */}
        <Route path="/super-admin" element={<ProtectedLayout allowedRoles={['super_admin']} />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="districts" element={<DistrictsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="routing-rules" element={<RoutingRulesPage />} />
          <Route path="complaints" element={<AllComplaintsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>

        {/* Department Admin Workspace */}
        <Route path="/department-admin" element={<ProtectedLayout allowedRoles={['department_admin', 'super_admin']} />}>
          <Route index element={<DeptDashboard />} />
          <Route path="complaints" element={<DeptComplaintsPage />} />
        </Route>

        {/* District Reviewer Workspace */}
        <Route path="/reviewer" element={<ProtectedLayout allowedRoles={['reviewer', 'super_admin']} />}>
          <Route index element={<ReviewerDashboard />} />
          <Route path="pending" element={<PendingReviewsPage />} />
          <Route path="history" element={<ReviewHistoryPage />} />
        </Route>

        {/* Citizen Workspace */}
        <Route path="/citizen" element={<ProtectedLayout allowedRoles={['citizen', 'super_admin']} />}>
          <Route index element={<CitizenDashboard />} />
          <Route path="submit" element={<SubmitComplaintPage />} />
          <Route path="complaints" element={<MyComplaintsPage />} />
          <Route path="complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

