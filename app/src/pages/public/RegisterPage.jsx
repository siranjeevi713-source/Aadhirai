import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [districts, setDistricts] = useState([])
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '', homeDistrictId: '', consent: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/super-admin/districts').then(r => setDistricts(r.data.data || [])).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!/^\d{10}$/.test(form.mobile)) { setError('Mobile number must be exactly 10 digits.'); return }
    if (!form.consent) { setError('Please accept the terms and conditions.'); return }

    setLoading(true)
    try {
      const res = await register({ name: form.name, email: form.email, mobile: form.mobile, password: form.password, homeDistrictId: form.homeDistrictId || undefined, consent: true })
      if (!res.success) { setError(res.message); return }
      navigate('/citizen', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#082D50 0%,#064A86 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#082D50' }}>AADHIRAI</div>
          <div style={{ fontSize: '0.72rem', color: '#13C6B5', fontWeight: 700, letterSpacing: '0.1em' }}>CITIZEN REGISTRATION</div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" type="text" placeholder="Enter your full name" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input className="form-input" type="tel" placeholder="10-digit mobile" maxLength={10} value={form.mobile} onChange={e => set('mobile', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input className="form-input" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Home District (Optional)</label>
            <select className="form-select" value={form.homeDistrictId} onChange={e => set('homeDistrictId', e.target.value)}>
              <option value="">— Select your home district —</option>
              {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <input type="checkbox" id="consent" checked={form.consent} onChange={e => set('consent', e.target.checked)} style={{ marginTop: 3 }} />
            <label htmlFor="consent" style={{ fontSize: '0.78rem', color: '#64748B', cursor: 'pointer' }}>
              I agree to the terms and conditions. I consent to my data being used for civic complaint processing.
            </label>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Registering…' : 'Create Account →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: '#64748B' }}>
          Already registered? <Link to="/login" style={{ color: '#075CE5', fontWeight: 700 }}>Sign in here</Link>
        </div>
      </div>
    </div>
  )
}

