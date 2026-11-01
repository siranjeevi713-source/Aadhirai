import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', mobile: '', password: '' })
  const [useEmail, setUseEmail] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const creds = { password: form.password }
      if (useEmail) creds.email = form.email
      else creds.mobile = form.mobile

      const res = await login(creds)
      if (!res.success) { setError(res.message); return }

      const roleMap = { super_admin: '/super-admin', department_admin: '/dept-admin', reviewer: '/reviewer', citizen: '/citizen' }
      navigate(roleMap[res.user.role] || '/citizen', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#082D50 0%,#064A86 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#082D50' }}>AADHIRAI</div>
          <div style={{ fontSize: '0.72rem', color: '#13C6B5', fontWeight: 700, letterSpacing: '0.1em' }}>NAMMAOOR AI</div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.5rem' }}>Civic Accountability Engine</div>
        </div>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>Sign In</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.5rem' }}>Access your dashboard to manage civic complaints.</p>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Login method toggle */}
        <div style={{ display: 'flex', marginBottom: '1.25rem', border: '1.5px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
          {[['Email', true], ['Mobile', false]].map(([label, v]) => (
            <button key={label} onClick={() => setUseEmail(v)} className="btn" style={{ flex: 1, borderRadius: 0, background: useEmail === v ? '#075CE5' : 'transparent', color: useEmail === v ? '#fff' : '#64748B', border: 'none' }}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {useEmail ? (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input className="form-input" type="tel" placeholder="10-digit mobile number" maxLength={10} value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} required />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748B' }}>
          New citizen? <Link to="/register" style={{ color: '#075CE5', fontWeight: 700 }}>Register here</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem' }}>
          <Link to="/" style={{ color: '#64748B' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}

